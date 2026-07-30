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
import { OrderNotificationService } from '../../common/services/order-notification.service';
import { CouponsService } from '../coupons/coupons.service';

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
    private orderNotificationService: OrderNotificationService,
    private couponsService: CouponsService,
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
  async createOrderAndPayment(dto: CreatePaymentDto, user: User | null) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Build order items and calculate subtotal
      const orderItems: OrderItem[] = [];
      // Datos legibles por línea para el correo/WhatsApp (nombre real + ml).
      const notificationItems: {
        name: string;
        quantity: number;
        price: number;
        ml?: number;
      }[] = [];
      let subtotal = 0;
      // Demanda de decants acumulada por producto (ml). Tope: el ml físico del
      // producto (no se importan decants sueltos sin frasco que abrir).
      const decantDemand = new Map<number, { product: Product; ml: number }>();

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

          // Frasco completo: SIEMPRE comprable. Si no hay stock sellado, el
          // excedente se importa bajo pedido (se registra como bajoPedidoQuantity
          // al descontar stock). Los decants se topan al ml físico del producto:
          // se acumulan aquí para validar contra el inventario. Si los frascos
          // del MISMO pedido consumen ese ml, los decants no se rechazan — al
          // descontar quedan marcados como bajo pedido.
          if (!variation.isFullBottle) {
            const ml = Number(variation.mlSize || 0) * item.quantity;
            const prev = decantDemand.get(variation.product.id);
            decantDemand.set(variation.product.id, {
              product: variation.product,
              ml: (prev?.ml ?? 0) + ml,
            });
          }

          const price = item.priceOverride ?? Number(variation.price || variation.product.price);
          const itemSubtotal = price * item.quantity;
          subtotal += itemSubtotal;

          orderItems.push(queryRunner.manager.create(OrderItem, {
            productId: variation.product.id,
            productVariationId: variation.id,
            price,
            quantity: item.quantity,
            subtotal: itemSubtotal,
          }));

          notificationItems.push({
            name: variation.product.name,
            quantity: item.quantity,
            price,
            ml: Number(variation.mlSize) || undefined,
          });
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

          // Frasco completo directo: SIEMPRE comprable. Sin stock sellado, el
          // excedente se importa bajo pedido (se registra como bajoPedidoQuantity
          // al descontar stock). Sin tope duro.

          const price = item.priceOverride ?? Number(product.price);
          const itemSubtotal = price * item.quantity;
          subtotal += itemSubtotal;

          const oi = new OrderItem();
          oi.productId = product.id;
          oi.price = price;
          oi.quantity = item.quantity;
          oi.subtotal = itemSubtotal;
          orderItems.push(oi);

          notificationItems.push({
            name: product.name,
            quantity: item.quantity,
            price,
            ml: Number(product.totalMl) || undefined,
          });
        }
      }

      // Validar decants: nunca permitir más ml de los que existen físicamente.
      // (Los frascos del mismo pedido no restan aquí: si se llevan el stock, el
      // descuento marca esos decants como bajo pedido en vez de rechazarlos.)
      for (const { product: p, ml } of decantDemand.values()) {
        const availableMl = this.stockService.getAvailableMl(p);
        if (availableMl < ml) {
          throw new BadRequestException(
            `No hay suficiente stock para preparar los decants de "${p.name}". ` +
              `Disponible: ${availableMl} ml, solicitado: ${ml} ml.`,
          );
        }
      }

      // Calculate costs
      let deliveryCost = Math.max(0, dto.deliveryCost ?? 0);

      // Cupón: SIEMPRE validado en el servidor (no se confía en
      // couponDiscount enviado por el cliente). Solo se aplica si el código
      // es válido; free shipping pone el envío en 0.
      let couponDiscount = 0;
      let validatedCouponId: number | null = null;
      if (dto.couponCode) {
        const couponResult = await this.couponsService.validate(
          { code: dto.couponCode, orderAmount: subtotal },
          user?.id,
        );
        if (couponResult.valid) {
          couponDiscount = couponResult.freeShipping
            ? 0
            : Number(couponResult.discount) || 0;
          if (couponResult.freeShipping) deliveryCost = 0;
          validatedCouponId = couponResult.coupon
            ? Number(couponResult.coupon.id)
            : null;
        }
      }
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
        // Guest checkout: sin sesión la orden no tiene dueño (userId null).
        userId: user?.id ?? null,
        status: OrderStatus.CREATED,
        subtotal,
        deliveryCost,
        payphoneSurcharge,
        couponDiscount,
        total,
        customerName:
          dto.customerName ||
          (user ? `${user.firstName} ${user.lastName}` : ''),
        customerEmail: dto.customerEmail || user?.email || '',
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

      // Registrar uso del cupón (incrementa currentUses) — best effort.
      // Solo para usuarios con sesión: recordUsage necesita userId. En guest
      // se aplica el descuento pero no se registra uso por-usuario.
      if (validatedCouponId != null && user) {
        await this.couponsService
          .recordUsage(validatedCouponId, user.id, savedOrder.id)
          .catch(() => {});
      }

      // Send notifications (fire and forget)
      const notificationData = {
        orderNumber,
        customerName:
          dto.customerName ||
          (user ? `${user.firstName} ${user.lastName}` : ''),
        customerEmail: dto.customerEmail || user?.email || '',
        customerPhone: dto.customerPhone || '',
        total,
        paymentMethod: dto.paymentMethod,
        deliveryMethod: dto.deliveryMethod,
        shippingAddress: dto.shippingAddress,
        shippingCity: dto.shippingCity,
        items: notificationItems,
      };
      const notification = await this.orderNotificationService.notifyNewOrder(notificationData).catch(() => ({ whatsappUrl: '' }));

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
        whatsappUrl: notification?.whatsappUrl || null,
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
   * Idempotent via OrderItem.stockDeductedAt — items already deducted are skipped.
   */
  private async deductStockForOrder(
    order: Order,
    queryRunner: import('typeorm').QueryRunner,
  ): Promise<void> {
    const now = new Date();
    const pendingItems = order.items.filter((i) => !i.stockDeductedAt);

    // Resolver las variaciones una sola vez: hace falta saber cuáles son
    // decants ANTES de descontar para poder ordenar el descuento.
    const variations = new Map<number, ProductVariation>();
    for (const item of pendingItems) {
      if (item.productVariationId && !variations.has(item.productVariationId)) {
        const v = await this.variationsRepository.findOne({
          where: { id: item.productVariationId },
          relations: ['product'],
        });
        if (v) variations.set(item.productVariationId, v);
      }
    }

    // Los frascos sellados tienen prioridad sobre los decants: si el pedido
    // lleva ambos del mismo producto, las botellas consumen el stock y los ml
    // que ya no alcanzan quedan como bajoPedidoQuantity en los decants.
    const isDecant = (item: OrderItem) => {
      const v = item.productVariationId ? variations.get(item.productVariationId) : null;
      return v ? !v.isFullBottle : false;
    };
    const ordered = [...pendingItems].sort(
      (a, b) => Number(isDecant(a)) - Number(isDecant(b)),
    );

    for (const item of ordered) {
      if (item.productVariationId) {
        const variation = variations.get(item.productVariationId);

        if (!variation || !variation.product) continue;

        if (variation.isFullBottle) {
          const result = await this.stockService.deductFullBottleStock(
            variation.product,
            item.quantity,
            queryRunner,
          );
          item.bajoPedidoQuantity = result.pendingQuantity;
        } else {
          const result = await this.stockService.deductDecantStock(
            variation.product,
            Number(variation.mlSize),
            item.quantity,
            queryRunner,
          );
          item.mlDeducted = result.mlDeducted;
          item.bottlesOpened = result.bottlesOpened;
          item.bajoPedidoQuantity = result.pendingQuantity;
        }
      } else if (item.productId) {
        const product = await this.productsRepository.findOne({
          where: { id: item.productId },
        });

        if (product) {
          const result = await this.stockService.deductFullBottleStock(
            product,
            item.quantity,
            queryRunner,
          );
          item.bajoPedidoQuantity = result.pendingQuantity;
        }
      }
      item.stockDeductedAt = now;
      await queryRunner.manager.save(OrderItem, item);
    }
  }

  /**
   * Verify payment after PayPhone redirect. Idempotent: if the order is
   * already paid and in a fulfillment status, returns the cached result
   * without re-querying PayPhone or re-deducting stock.
   */
  async verifyAndConfirmPayment(
    paymentId: string,
    clientTransactionId: string,
  ) {
    const order = await this.ordersRepository.findOne({
      where: { clientTransactionId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(
        `Order with clientTransactionId ${clientTransactionId} not found`,
      );
    }

    // Idempotency short-circuit — payment already confirmed for this order
    const fulfillmentStatuses = [
      OrderStatus.RECEIVED,
      OrderStatus.ACCEPTED,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];
    if (
      order.paymentStatus === 'paid' &&
      fulfillmentStatuses.includes(order.status)
    ) {
      return {
        order: new OrderResponseDto(order),
        paymentStatus: order.paymentStatus,
        transactionStatus: 3,
        transactionStatusName: 'Approved',
        approved: true,
        alreadyConfirmed: true,
      };
    }

    const confirmation = await this.payPhoneService.confirm(
      paymentId,
      clientTransactionId,
    );

    const approved = this.payPhoneService.isApproved(confirmation.statusCode);

    if (approved) {
      // Anti-tampering: el monto confirmado por PayPhone (en centavos) debe
      // coincidir con el total de la orden. Evita marcar como pagada una
      // orden cara reutilizando el pago de otra más barata.
      const expectedCents = Math.round(Number(order.total) * 100);
      const paidCents = Math.round(Number(confirmation.amount));
      if (Math.abs(expectedCents - paidCents) > 1) {
        order.paymentStatus = 'failed';
        order.paymentReference = `amount_mismatch expected=${expectedCents} paid=${paidCents}`;
        await this.ordersRepository.save(order);
        return {
          order: new OrderResponseDto(order),
          paymentStatus: order.paymentStatus,
          transactionStatus: confirmation.statusCode,
          transactionStatusName: confirmation.transactionStatus,
          approved: false,
        };
      }

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
   * Reconcile PayPhone payments that never got confirmed because the customer
   * closed the browser before being redirected back. Looks for orders with
   * paymentStatus='pending', a payphonePaymentId, and older than 5 minutes —
   * then calls verifyAndConfirmPayment on each. Safe to run repeatedly.
   */
  async reconcilePendingPayphoneOrders() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const candidates = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.paymentStatus = :status', { status: 'pending' })
      .andWhere('order.payphonePaymentId IS NOT NULL')
      .andWhere('order.clientTransactionId IS NOT NULL')
      .andWhere('order.createdAt < :cutoff', { cutoff: fiveMinutesAgo })
      .getMany();

    const results: Array<{
      orderId: number;
      orderNumber: string;
      outcome: 'confirmed' | 'still_pending' | 'error';
      message?: string;
    }> = [];

    for (const order of candidates) {
      try {
        const result = await this.verifyAndConfirmPayment(
          order.payphonePaymentId!,
          order.clientTransactionId!,
        );
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          outcome: result.approved ? 'confirmed' : 'still_pending',
        });
      } catch (error: any) {
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          outcome: 'error',
          message: error?.message ?? String(error),
        });
      }
    }

    return {
      scanned: candidates.length,
      confirmed: results.filter((r) => r.outcome === 'confirmed').length,
      stillPending: results.filter((r) => r.outcome === 'still_pending').length,
      errors: results.filter((r) => r.outcome === 'error').length,
      details: results,
    };
  }

  /**
   * Upload transfer receipt image for an order
   */
  async uploadTransferReceipt(
    orderId: number,
    file: Express.Multer.File,
    user: User | null,
  ) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId as any },
      relations: ['items'],
    });

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    // Órdenes guest (sin dueño) aceptan comprobante sin sesión. Las que tienen
    // dueño exigen ser el propio usuario o un admin.
    if (
      order.userId != null &&
      order.userId !== user?.id &&
      user?.role !== 'admin'
    ) {
      throw new BadRequestException('No tienes permisos para esta orden');
    }

    // Delete old receipt if exists
    if (order.transferReceiptKey) {
      await this.s3Service.deleteFile(order.transferReceiptKey).catch(() => {});
    }

    const uploaded = await this.s3Service.uploadFile(file, 'receipts', [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]);
    order.transferReceiptUrl = uploaded.url;
    order.transferReceiptKey = uploaded.key;
    order.paymentStatus = 'receipt_uploaded';

    await this.ordersRepository.save(order);
    return new OrderResponseDto(order);
  }
}
