import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariation } from '../products/entities/product-variation.entity';
import { User } from '../users/entities/user.entity';
import { OrderStatus } from '../../common/constants/order-status.enum';
import { OrderResponseDto } from '../orders/dto/order-response.dto';
import { PayPhoneService } from './payphone.service';
import { S3Service } from '../../common/services/s3.service';
import { StockService } from '../products/stock.service';
import { OrderStatusHistory } from '../orders/entities/order-status-history.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

const PAYPHONE_SURCHARGE_RATE = 0.06; // 6%

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductVariation)
    private variationsRepository: Repository<ProductVariation>,
    private dataSource: DataSource,
    private payPhoneService: PayPhoneService,
    private s3Service: S3Service,
    private stockService: StockService,
  ) {}

  private generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `ND-${year}-${random}`;
  }

  /**
   * Create order + initiate payment (PayPhone or Transferencia)
   */
  async createOrderAndPayment(dto: CreatePaymentDto, user: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Build order items and calculate subtotal
      const orderItems: OrderItem[] = [];
      let subtotal = 0;

      for (const item of dto.items) {
        if (item.productVariationId) {
          // Decant purchase — via variation
          const variation = await this.variationsRepository.findOne({
            where: { id: item.productVariationId },
            relations: ['product'],
          });

          if (!variation) {
            throw new NotFoundException(
              `Variation ${item.productVariationId} not found`,
            );
          }

          if (!variation.isActive || !variation.product?.isActive) {
            throw new BadRequestException(
              `Variation ${item.productVariationId} is not active`,
            );
          }

          const price = Number(variation.price || variation.product.price);
          const itemSubtotal = price * item.quantity;
          subtotal += itemSubtotal;

          orderItems.push(queryRunner.manager.create(OrderItem, {
            productId: variation.product.id,
            productVariationId: variation.id,
            price,
            quantity: item.quantity,
            subtotal: itemSubtotal,
          }));
        } else if (item.productId) {
          // Full bottle purchase — via product directly
          const product = await this.productsRepository.findOne({
            where: { id: item.productId },
          });

          if (!product) {
            throw new NotFoundException(`Product ${item.productId} not found`);
          }

          if (!product.isActive) {
            throw new BadRequestException(`Product ${item.productId} is not active`);
          }

          const price = Number(product.price);
          const itemSubtotal = price * item.quantity;
          subtotal += itemSubtotal;

          const oi = new OrderItem();
          oi.productId = product.id;
          oi.price = price;
          oi.quantity = item.quantity;
          oi.subtotal = itemSubtotal;
          orderItems.push(oi);
        }
      }

      // Calculate costs
      const deliveryCost = dto.deliveryCost ?? 0;
      const couponDiscount = dto.couponDiscount ?? 0;
      const afterDiscount = Math.max(0, subtotal - couponDiscount);
      const isPayphone = dto.paymentMethod === 'PAYPHONE';
      const payphoneSurcharge = isPayphone
        ? Math.round((afterDiscount + deliveryCost) * PAYPHONE_SURCHARGE_RATE * 100) / 100
        : 0;
      const total = afterDiscount + deliveryCost + payphoneSurcharge;

      const orderNumber = this.generateOrderNumber();
      const clientTransactionId = `${orderNumber}-${Math.random().toString(36).substring(2, 10)}`;

      const order = queryRunner.manager.create(Order, {
        orderNumber,
        userId: user.id,
        status: OrderStatus.CREATED,
        subtotal,
        deliveryCost,
        payphoneSurcharge,
        couponDiscount,
        total,
        customerName: dto.customerName || `${user.firstName} ${user.lastName}`,
        customerEmail: dto.customerEmail || user.email,
        customerPhone: dto.customerPhone || '',
        deliveryMethod: dto.deliveryMethod,
        paymentMethod: dto.paymentMethod,
        paymentStatus: 'pending',
        clientTransactionId,
        shippingAddress: dto.shippingAddress,
        shippingCity: dto.shippingCity,
        notes: dto.notes,
        items: orderItems,
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      // Record initial status
      const historyEntry = queryRunner.manager.create(OrderStatusHistory, {
        orderId: savedOrder.id,
        fromStatus: 'nuevo',
        toStatus: OrderStatus.CREATED,
        changedBy: 'sistema',
        note: 'Orden creada',
      });
      await queryRunner.manager.save(OrderStatusHistory, historyEntry);

      await queryRunner.commitTransaction();

      // If PayPhone, create payment link (after commit so order exists regardless)
      if (isPayphone) {
        try {
          const payphone = await this.payPhoneService.prepare({
            amount: total,
            clientTransactionId,
            reference: `Orden ${orderNumber}`,
            email: dto.customerEmail,
            phoneNumber: dto.customerPhone,
          });

          // Save PayPhone payment ID
          savedOrder.payphonePaymentId = String(payphone.paymentId);
          await this.ordersRepository.save(savedOrder);

          return {
            order: new OrderResponseDto(savedOrder),
            paymentUrl: payphone.payWithCard,
            payWithPayPhone: payphone.payWithPayPhone,
            paymentId: payphone.paymentId,
          };
        } catch (payphoneError) {
          // Order was created but PayPhone failed — mark as failed
          savedOrder.paymentStatus = 'payphone_error';
          savedOrder.notes = `PayPhone error: ${(payphoneError as any)?.message ?? payphoneError}`;
          await this.ordersRepository.save(savedOrder);
          throw payphoneError;
        }
      }

      // For Transferencia, just return the order
      return {
        order: new OrderResponseDto(savedOrder),
        paymentUrl: null,
      };
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Deduct stock for all items in an order using a transaction.
   * For each item with a variation: full bottles deduct sealed stock,
   * decants deduct ml from open/sealed bottles.
   */
  private async deductStockForOrder(
    order: Order,
    queryRunner: import('typeorm').QueryRunner,
  ): Promise<void> {
    for (const item of order.items) {
      if (item.productVariationId) {
        // Decant or variation purchase
        const variation = await this.variationsRepository.findOne({
          where: { id: item.productVariationId },
          relations: ['product'],
        });

        if (!variation || !variation.product) continue;

        if (variation.isFullBottle) {
          await this.stockService.deductFullBottleStock(
            variation.product,
            item.quantity,
            queryRunner,
          );
        } else {
          const result = await this.stockService.deductDecantStock(
            variation.product,
            Number(variation.mlSize),
            item.quantity,
            queryRunner,
          );

          item.mlDeducted = result.mlDeducted;
          item.bottlesOpened = result.bottlesOpened;
          await queryRunner.manager.save(OrderItem, item);
        }
      } else if (item.productId) {
        // Full bottle purchase — deduct sealed stock directly
        const product = await this.productsRepository.findOne({
          where: { id: item.productId },
        });

        if (product) {
          await this.stockService.deductFullBottleStock(
            product,
            item.quantity,
            queryRunner,
          );
        }
      }
    }
  }

  /**
   * Verify payment after PayPhone redirect
   */
  async verifyAndConfirmPayment(
    paymentId: string,
    clientTransactionId: string,
  ) {
    // Find order by clientTransactionId
    const order = await this.ordersRepository.findOne({
      where: { clientTransactionId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(
        `Order with clientTransactionId ${clientTransactionId} not found`,
      );
    }

    // Confirm with PayPhone
    const confirmation = await this.payPhoneService.confirm(
      paymentId,
      clientTransactionId,
    );

    const approved = this.payPhoneService.isApproved(confirmation.statusCode);

    if (approved) {
      // Use a transaction for stock deduction + order status update
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        order.paymentStatus = 'paid';
        order.paymentReference = String(confirmation.transactionId);
        order.status = OrderStatus.RECEIVED;
        order.receivedAt = new Date();

        await this.deductStockForOrder(order, queryRunner);
        await queryRunner.manager.save(Order, order);
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } else {
      order.paymentStatus = 'failed';
      order.paymentReference = `${confirmation.transactionStatus} (${confirmation.statusCode})`;
      await this.ordersRepository.save(order);
    }

    return {
      order: new OrderResponseDto(order),
      paymentStatus: order.paymentStatus,
      transactionStatus: confirmation.statusCode,
      transactionStatusName: confirmation.transactionStatus,
      approved,
    };
  }

  /**
   * Upload transfer receipt image for an order
   */
  async uploadTransferReceipt(
    orderId: number,
    file: Express.Multer.File,
    user: User,
  ) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId as any },
      relations: ['items'],
    });

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    if (order.userId !== user.id && user.role !== 'admin') {
      throw new BadRequestException('No tienes permisos para esta orden');
    }

    // Delete old receipt if exists
    if (order.transferReceiptKey) {
      await this.s3Service.deleteFile(order.transferReceiptKey).catch(() => {});
    }

    const uploaded = await this.s3Service.uploadFile(file, 'receipts');
    order.transferReceiptUrl = uploaded.url;
    order.transferReceiptKey = uploaded.key;
    order.paymentStatus = 'receipt_uploaded';

    await this.ordersRepository.save(order);
    return new OrderResponseDto(order);
  }
}
