import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariation } from '../products/entities/product-variation.entity';
import { Transaction } from '../finance/entities/transaction.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateManualOrderDto } from './dto/create-manual-order.dto';
import {
  getDeliveryCost,
  requiresShipment,
} from '../../common/constants/delivery-methods';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { OrderStatus } from '../../common/constants/order-status.enum';
import { CartService } from '../cart/cart.service';
import { StockService } from '../products/stock.service';
import { EmailService } from '../email/email.service';
import { WalletfyService } from '../walletfy/walletfy.service';
import { OrderEmailData, OrderEmailItem } from '../email/email.types';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductVariation)
    private productVariationsRepository: Repository<ProductVariation>,
    @InjectRepository(OrderStatusHistory)
    private statusHistoryRepository: Repository<OrderStatusHistory>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private dataSource: DataSource,
    private cartService: CartService,
    private stockService: StockService,
    private emailService: EmailService,
    private usersService: UsersService,
    private walletfyService: WalletfyService,
  ) {}

  /**
   * Datos del pedido para la matriz de mailing. `update()` ya carga productos y
   * variaciones, así que los nombres reales salen de ahí sin consultas extra.
   */
  private buildOrderEmailData(order: Order): OrderEmailData {
    const items: OrderEmailItem[] = (order.items ?? []).map((item) => {
      const variation = item.productVariation;
      const baseName = item.product?.name ?? variation?.product?.name ?? 'Producto';
      // La variante comprada (color + talla) va en el nombre del ítem:
      // "Olivia Maxi Tote — Espresso · Midi". Sin esto el correo decía solo
      // el producto y el cliente no veía qué color/talla pidió.
      const variantDetail = [variation?.name, variation?.size].filter(Boolean).join(' · ');
      return {
        name: variantDetail ? `${baseName} — ${variantDetail}` : baseName,
        quantity: item.quantity,
        price: Number(item.price),
      };
    });

    return {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      deliveryMethod: order.deliveryMethod,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      subtotal: Number(order.subtotal ?? order.total),
      deliveryCost: Number(order.deliveryCost ?? 0),
      payphoneSurcharge: Number(order.payphoneSurcharge ?? 0),
      couponDiscount: Number(order.couponDiscount ?? 0),
      total: Number(order.total),
      items,
    };
  }


  /**
   * Correos que dispara una actualización del pedido (M-03 a M-08).
   *
   * Dos disparadores, no uno: el cambio de estado y la guía. La segunda guía de
   * un pedido mixto llega cuando el pedido ya está en "Enviado" —sin cambio de
   * estado que la anuncie—, así que sin mirar `trackingChanged` ese correo
   * nunca salía.
   *
   * Va en segundo plano y nunca lanza: el pedido ya se guardó y un fallo de
   * correo no puede deshacerlo ni romper la respuesta del panel.
   */
  private notifyStatusChange(
    order: Order,
    previousStatus: OrderStatus,
    hadTrackingBefore: boolean,
    trackingChanged = false,
  ): void {
    const statusChanged = order.status !== previousStatus;
    if (!statusChanged && !trackingChanged) return;

    const data = this.buildOrderEmailData(order);
    // Con tarjeta la confirmación ya salió al aprobarse el pago (M-01); con
    // transferencia o efectivo el aviso de "pago confirmado" lo da el admin.
    const adminConfirmsPayment =
      order.paymentMethod === 'TRANSFERENCIA' ||
      order.paymentMethod === 'EFECTIVO';
    const fail = (label: string) => (err: any) =>
      console.error(`[Orders] correo ${label} falló:`, err?.message);

    // M-05 / M-06 / M-07 · guía generada. El disparador real es la guía, venga
    // con el paso a "Enviado" o después (segunda guía del bajo pedido).
    if (
      order.status === OrderStatus.SHIPPED &&
      order.trackingCode &&
      (trackingChanged || statusChanged)
    ) {
      this.emailService
        .sendOrderShippedEmail(
          data,
          order.trackingCode,
          'full',
        )
        .catch(fail('M-05/06/07'));
    }

    if (!statusChanged) return;

    switch (order.status) {
      // M-03 · el admin confirmó el pago. El panel colapsó "Aceptado" dentro de
      // "Pagado" (order_received), así que ambos estados valen: si solo se
      // escuchara ACCEPTED este correo no saldría nunca desde el admin.
      case OrderStatus.ACCEPTED:
      case OrderStatus.RECEIVED:
        if (adminConfirmsPayment) {
          this.emailService.sendTransferApprovedEmail(data).catch(fail('M-03'));
        }
        break;

      // M-04 · el comprobante no sirvió.
      case OrderStatus.REJECTED:
        if (order.paymentMethod === 'TRANSFERENCIA') {
          this.emailService.sendTransferRejectedEmail(data).catch(fail('M-04'));
        }
        break;

      // M-08 · Servientrega marcó la entrega: carta de agradecimiento.
      case OrderStatus.DELIVERED:
        this.emailService
          .sendOrderDeliveredEmail(order.customerEmail, order.customerName)
          .catch(fail('M-08'));
        break;

      default:
        break;
    }
  }

  private resolveItemCost(product: Product | null, variation: ProductVariation | null): number {
    const variationCost = variation?.cost != null ? Number(variation.cost) : null;
    if (variationCost && variationCost > 0) return variationCost;
    return Number(product?.cost ?? 0);
  }

  /**
   * Record a status change in history
   */
  private async recordStatusChange(
    orderId: number,
    fromStatus: string,
    toStatus: string,
    changedBy?: string,
    note?: string,
  ) {
    const entry = this.statusHistoryRepository.create({
      orderId,
      fromStatus,
      toStatus,
      changedBy: changedBy ?? 'sistema',
      note,
    });
    await this.statusHistoryRepository.save(entry);
  }

  /**
   * Get status history for an order
   */
  async getStatusHistory(orderId: number) {
    return this.statusHistoryRepository.find({
      where: { orderId: orderId as any },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Generate unique order number
   */
  private generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `LIVI-${year}-${random}`;
  }

  /**
   * Create a new order
   */
  async create(createOrderDto: CreateOrderDto, userId: number): Promise<OrderResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate and process items
      const orderItems: OrderItem[] = [];
      let total = 0;

      for (const itemDto of createOrderDto.items) {
        // Validate that either productId or productVariationId is provided, but not both
        if (!itemDto.productId && !itemDto.productVariationId) {
          throw new BadRequestException(
            'Each order item must have either productId or productVariationId',
          );
        }

        if (itemDto.productId && itemDto.productVariationId) {
          throw new BadRequestException(
            'Order item cannot have both productId and productVariationId',
          );
        }

        let product: Product | null = null;
        let productVariation: ProductVariation | null = null;
        let price: number = 0;
        let productId: number | null = null;
        let productVariationId: number | null = null;

        if (itemDto.productVariationId) {
          // Ordering a specific variation
          productVariation = await this.productVariationsRepository.findOne({
            where: { id: itemDto.productVariationId },
            relations: ['product'],
          });

          if (!productVariation) {
            throw new NotFoundException(
              `Product variation with ID ${itemDto.productVariationId} not found`,
            );
          }

          if (!productVariation.isActive) {
            throw new BadRequestException(
              `Product variation with ID ${itemDto.productVariationId} is not active`,
            );
          }

          product = productVariation.product;
          if (!product || !product.isActive) {
            throw new BadRequestException(
              `Product for variation ${itemDto.productVariationId} is not active`,
            );
          }

          price = productVariation.price || product.price;
          productId = product.id;
          productVariationId = productVariation.id;
        } else if (itemDto.productId) {
          // Ordering base product — auto-resolve to the canonical full-bottle
          // variation when available so we have a single sellable unit.
          product = await this.productsRepository.findOne({
            where: { id: itemDto.productId },
            relations: ['variations'],
          });

          if (!product) {
            throw new NotFoundException(`Product with ID ${itemDto.productId} not found`);
          }

          if (!product.isActive) {
            throw new BadRequestException(
              `Product with ID ${itemDto.productId} is not active`,
            );
          }

          const activeVariations = product.variations?.filter((v) => v.isActive) || [];

          if (activeVariations.length > 0) {
            // El producto tiene variantes (color, tamaño…): hay que pedir una
            // variación específica, no el producto base.
            throw new BadRequestException(
              `Product with ID ${itemDto.productId} has variations. You must order a specific variation instead of the base product. Available variations: ${activeVariations.map((v) => v.id).join(', ')}`,
            );
          }

          // Sin variaciones: se vende el producto base directamente.
          price = product.price;
          productId = product.id;
        } else {
          // This should never happen due to validation, but TypeScript needs this
          throw new BadRequestException(
            'Each order item must have either productId or productVariationId',
          );
        }

        // Ensure price was set (TypeScript safety check)
        if (price === 0) {
          throw new BadRequestException('Unable to determine price for order item');
        }

        const subtotal = Number(price) * itemDto.quantity;
        total += subtotal;

        const costSnapshot = this.resolveItemCost(product, productVariation);

        // Create order item with proper handling of nullable fields
        const orderItemData: any = {
          price: Number(price),
          costSnapshot,
          quantity: itemDto.quantity,
          subtotal,
        };

        if (productId) {
          orderItemData.productId = productId;
        }

        if (productVariationId) {
          orderItemData.productVariationId = productVariationId;
        }

        const orderItem = queryRunner.manager.create(OrderItem, orderItemData);

        orderItems.push(orderItem);
      }

      // Fetch user info for customer details
      const orderUser = await queryRunner.manager.findOneBy('User', { id: userId });

      // Create order
      const orderNumber = this.generateOrderNumber();
      const order = queryRunner.manager.create(Order, {
        orderNumber,
        userId,
        status: OrderStatus.CREATED,
        subtotal: total,
        total,
        customerName: orderUser ? `${(orderUser as any).firstName} ${(orderUser as any).lastName}`.trim() : undefined,
        customerEmail: (orderUser as any)?.email,
        customerPhone: (orderUser as any)?.phone,
        deliveryMethod: (orderUser as any)?.preferredDeliveryMethod,
        paymentMethod: createOrderDto.paymentMethod,
        shippingAddress: createOrderDto.shippingAddress || (orderUser as any)?.address,
        shippingCity: createOrderDto.shippingCity || (orderUser as any)?.city,
        shippingPostalCode: createOrderDto.shippingPostalCode,
        shippingCountry: createOrderDto.shippingCountry || 'Ecuador',
        notes: createOrderDto.notes,
        items: orderItems,
      });

      const savedOrder = await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();

      return this.findOne(savedOrder.id, userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create order from cart
   */
  async createFromCart(
    createOrderDto: Partial<CreateOrderDto>,
    userId: number,
  ): Promise<OrderResponseDto> {
    // Get cart items
    const cartItems = await this.cartService.getCartItemsForOrder(userId);

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty. Cannot create order from empty cart.');
    }

    // Create order DTO from cart items
    const orderDto: CreateOrderDto = {
      items: cartItems,
      paymentMethod: createOrderDto.paymentMethod,
      shippingAddress: createOrderDto.shippingAddress,
      shippingCity: createOrderDto.shippingCity,
      shippingPostalCode: createOrderDto.shippingPostalCode,
      shippingCountry: createOrderDto.shippingCountry,
      notes: createOrderDto.notes,
    };

    // Create order
    const order = await this.create(orderDto, userId);

    // Clear cart after successful order creation
    await this.cartService.clearCart(userId);

    return order;
  }

  /**
   * Find all orders (admin only, or user's own orders)
   */
  async findAll(userId: number, userRole: string): Promise<OrderResponseDto[]> {
    const where: any = {};
    
    // Clients can only see their own orders
    if (userRole === 'client') {
      where.userId = userId;
    }

    const orders = await this.ordersRepository.find({
      where,
      relations: ['items', 'items.product', 'items.product.images', 'items.productVariation', 'items.productVariation.images', 'user'],
      order: { createdAt: 'DESC' },
    });

    return orders.map((order) => new OrderResponseDto(order));
  }

  /**
   * Find one order by ID
   */
  async findOne(id: number, userId: number, userRole?: string): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'items.product.images', 'items.productVariation', 'items.productVariation.images', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Clients can only access their own orders
    if (userRole === 'client' && order.userId !== userId) {
      throw new ForbiddenException('You can only access your own orders');
    }

    return new OrderResponseDto(order);
  }

  /**
   * Statuses that indicate stock has already been deducted.
   * Used to determine if stock needs to be restored on cancellation.
   */
  private static readonly STOCK_DEDUCTED_STATUSES: OrderStatus[] = [
    OrderStatus.RECEIVED,
    OrderStatus.ACCEPTED,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.DELAYED,
  ];

  /**
   * Create finance Transaction rows linked to an order when it transitions
   * into a fulfillment status for the first time:
   *  - COGS expense (sum of item.costSnapshot * quantity)
   *  - Payphone fee expense (when surcharge > 0)
   * Idempotent: skips creation if a transaction with the same referenceType
   * and orderId already exists.
   */
  private async createCogsTransactionsForOrder(
    order: Order,
    queryRunner: import('typeorm').QueryRunner,
    now: Date,
  ): Promise<void> {
    const txRepo = queryRunner.manager.getRepository(Transaction);
    const today = now.toISOString().split('T')[0];

    const cogsTotal = (order.items || []).reduce((sum, item) => {
      const unitCost = Number(item.costSnapshot ?? 0);
      const qty = Number(item.quantity ?? 0);
      return sum + unitCost * qty;
    }, 0);

    if (cogsTotal > 0) {
      const existing = await txRepo.findOne({
        where: { referenceType: 'order_cogs', referenceId: order.id },
      });
      if (!existing) {
        await txRepo.save(
          txRepo.create({
            type: 'expense',
            category: 'Costo de mercadería',
            amount: cogsTotal,
            date: today,
            paymentMethod: order.paymentMethod || 'Inventario',
            status: 'Pagado',
            description: `COGS orden ${order.orderNumber}`,
            notes: `Costo automático de productos vendidos en la orden ${order.orderNumber}`,
            referenceType: 'order_cogs',
            referenceId: order.id,
          }),
        );
      }
    }

    const payphoneFee = Number(order.payphoneSurcharge ?? 0);
    if (payphoneFee > 0) {
      const existing = await txRepo.findOne({
        where: { referenceType: 'order_payphone_fee', referenceId: order.id },
      });
      if (!existing) {
        await txRepo.save(
          txRepo.create({
            type: 'expense',
            category: 'Comisión Payphone',
            amount: payphoneFee,
            date: today,
            paymentMethod: 'Payphone',
            status: 'Pagado',
            description: `Recargo Payphone orden ${order.orderNumber}`,
            notes: `Comisión 6% Payphone aplicada a la orden ${order.orderNumber}`,
            referenceType: 'order_payphone_fee',
            referenceId: order.id,
          }),
        );
      }
    }
  }

  /**
   * Remove finance Transaction rows linked to an order. Used on cancellation
   * after stock has been restored, so reports reflect that the sale never
   * generated COGS or fees.
   */
  private async removeOrderTransactions(
    orderId: number,
    queryRunner: import('typeorm').QueryRunner,
  ): Promise<void> {
    const txRepo = queryRunner.manager.getRepository(Transaction);
    await txRepo.delete([
      { referenceType: 'order_cogs', referenceId: orderId },
      { referenceType: 'order_payphone_fee', referenceId: orderId },
    ]);
  }

  /**
   * Deduct stock for all items in an order using a transaction.
   * Idempotent: items with stockDeductedAt already set are skipped.
   */
  private async deductStockForOrder(
    order: Order,
    queryRunner: import('typeorm').QueryRunner,
  ): Promise<void> {
    console.log(`[StockDeduction] Order ${order.orderNumber}: ${order.items.length} items`);
    const now = new Date();
    const pendingItems = order.items.filter((i) => {
      if (i.stockDeductedAt) {
        console.log(`[StockDeduction] Item ${i.id} already deducted at ${i.stockDeductedAt} — skipping`);
        return false;
      }
      return true;
    });

    for (const item of pendingItems) {
      console.log(`[StockDeduction] Item: productId=${item.productId}, variationId=${item.productVariationId}, qty=${item.quantity}`);
      let product: Product | null = null;
      if (item.productVariationId) {
        const variation = await this.productVariationsRepository.findOne({
          where: { id: item.productVariationId },
          relations: ['product'],
        });
        product = variation?.product ?? null;
      } else if (item.productId) {
        product = await this.productsRepository.findOne({
          where: { id: item.productId },
        });
      }

      if (product) {
        await this.stockService.deductStock(product, item.quantity, queryRunner);
      }
      item.stockDeductedAt = now;
      await queryRunner.manager.save(OrderItem, item);
    }
  }

  /**
   * Restore stock for all items in an order using a transaction.
   */
  private async restoreStockForOrder(
    order: Order,
    queryRunner: import('typeorm').QueryRunner,
  ): Promise<void> {
    for (const item of order.items) {
      let product: Product | null = null;
      if (item.productVariationId) {
        const variation = await this.productVariationsRepository.findOne({
          where: { id: item.productVariationId },
          relations: ['product'],
        });
        product = variation?.product ?? null;
      } else if (item.productId) {
        product = await this.productsRepository.findOne({
          where: { id: item.productId },
        });
      }

      if (product) {
        await this.stockService.restoreStock(product, item.quantity, queryRunner);
      }
    }
  }

  /**
   * Update order (admin only for status changes, user can update their own orders in certain states)
   */
  async update(
    id: number,
    updateOrderDto: UpdateOrderDto,
    userId: number,
    userRole: string,
    userName?: string,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'items.product.images', 'items.productVariation', 'items.productVariation.images', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Estado y guía previos: con ellos se decide qué correo toca al final
    // (y si un pedido mixto va por su primera o su segunda guía).
    const statusBeforeUpdate = order.status;
    const hadTrackingBefore = Boolean(order.trackingCode);
    const incomingTracking = updateOrderDto.trackingCode?.trim() || null;
    const trackingChanged =
      updateOrderDto.trackingCode !== undefined &&
      incomingTracking !== (order.trackingCode || null);

    // Clients can only update their own orders, and only cancel them
    if (userRole === 'client') {
      if (order.userId !== userId) {
        throw new ForbiddenException('You can only update your own orders');
      }

      // Clients can only cancel orders in certain states
      if (updateOrderDto.status && updateOrderDto.status !== OrderStatus.CANCELLED) {
        throw new ForbiddenException('Clients can only cancel orders');
      }

      if (
        updateOrderDto.status === OrderStatus.CANCELLED &&
        ![OrderStatus.CREATED, OrderStatus.RECEIVED].includes(order.status)
      ) {
        throw new BadRequestException(
          'Order can only be cancelled in CREATED or RECEIVED status',
        );
      }
    }

    // Guardar la guía es, en la práctica, despachar: el admin escribe el número
    // de Servientrega y espera que al cliente le llegue su tracking. Si el
    // pedido todavía no estaba en "Enviado" lo movemos nosotros, para que el
    // correo salga y el historial refleje el despacho.
    if (
      userRole === 'admin' &&
      trackingChanged &&
      incomingTracking &&
      !updateOrderDto.status &&
      ![
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
      ].includes(order.status)
    ) {
      updateOrderDto.status = OrderStatus.SHIPPED;
    }

    // Determine if stock operations are needed
    const isStatusChanging = updateOrderDto.status && updateOrderDto.status !== order.status;
    // Deduct stock when transitioning to RECEIVED or any later fulfillment state
    // (in case admin skips RECEIVED and goes directly to SHIPPED/DELIVERED)
    const FULFILLMENT_STATUSES = [OrderStatus.RECEIVED, OrderStatus.ACCEPTED, OrderStatus.SHIPPED, OrderStatus.DELIVERED];
    const needsStockDeduction =
      isStatusChanging &&
      FULFILLMENT_STATUSES.includes(updateOrderDto.status as OrderStatus) &&
      !FULFILLMENT_STATUSES.includes(order.status); // Only if not already in a fulfillment state
    const needsStockRestoration =
      isStatusChanging &&
      updateOrderDto.status === OrderStatus.CANCELLED &&
      OrdersService.STOCK_DEDUCTED_STATUSES.includes(order.status);

    // Use a transaction when stock operations are involved
    if (needsStockDeduction || needsStockRestoration) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const previousStatus = order.status;
        const now = new Date();

        if (needsStockDeduction) {
          if (!order.receivedAt) order.receivedAt = now;
          order.status = updateOrderDto.status as OrderStatus;
          // Admin moving an order into fulfillment confirms payment too —
          // mark as paid so finance / dashboard count the revenue.
          if (!order.paymentStatus || order.paymentStatus === 'pending' || order.paymentStatus === 'receipt_uploaded') {
            order.paymentStatus = 'paid';
          }
          // El admin puede saltar directo a Enviado/Entregado: sin esto el
          // pedido quedaba sin fecha de despacho ni de entrega.
          if (order.status === OrderStatus.SHIPPED && !order.shippedAt) {
            order.shippedAt = now;
          }
          if (order.status === OrderStatus.DELIVERED && !order.deliveredAt) {
            order.deliveredAt = now;
          }
          await this.deductStockForOrder(order, queryRunner);
          await this.createCogsTransactionsForOrder(order, queryRunner, now);
        } else if (needsStockRestoration) {
          order.cancelledAt = now;
          order.status = OrderStatus.CANCELLED;
          await this.restoreStockForOrder(order, queryRunner);
          await this.removeOrderTransactions(order.id, queryRunner);
        }

        // Apply other field updates
        this.applyNonStatusUpdates(order, updateOrderDto);

        await queryRunner.manager.save(Order, order);
        await queryRunner.commitTransaction();

        // Walletfy · sello de fidelidad al confirmar el pago por transferencia:
        // el admin mueve la orden a RECEIVED (o más allá) y ahí se marca paid.
        if (needsStockDeduction) this.rewardWalletfy(order);

        // Record status change in history (outside transaction, non-critical)
        await this.recordStatusChange(
          order.id,
          previousStatus,
          updateOrderDto.status!,
          userName || (userRole === 'admin' ? 'Administrador' : 'Cliente'),
          updateOrderDto.statusNote,
        );

        this.notifyStatusChange(
          order,
          statusBeforeUpdate,
          hadTrackingBefore,
          trackingChanged,
        );

        return new OrderResponseDto(order);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    }

    // No stock operations needed — proceed without queryRunner
    if (isStatusChanging) {
      const previousStatus = order.status;
      const now = new Date();

      switch (updateOrderDto.status) {
        case OrderStatus.RECEIVED:
          order.receivedAt = now;
          break;
        case OrderStatus.ACCEPTED:
          order.acceptedAt = now;
          break;
        case OrderStatus.REJECTED:
          order.rejectedAt = now;
          break;
        case OrderStatus.SHIPPED:
          order.shippedAt = now;
          break;
        case OrderStatus.DELIVERED:
          order.deliveredAt = now;
          break;
        case OrderStatus.CANCELLED:
          order.cancelledAt = now;
          break;
        case OrderStatus.DELAYED:
          break;
      }

      order.status = updateOrderDto.status!;

      // Record status change in history
      await this.recordStatusChange(
        order.id,
        previousStatus,
        updateOrderDto.status!,
        userName || (userRole === 'admin' ? 'Administrador' : 'Cliente'),
        updateOrderDto.statusNote,
      );
    }

    // Apply other field updates
    this.applyNonStatusUpdates(order, updateOrderDto);

    const updatedOrder = await this.ordersRepository.save(order);

    this.notifyStatusChange(
      updatedOrder,
      statusBeforeUpdate,
      hadTrackingBefore,
      trackingChanged,
    );

    return new OrderResponseDto(updatedOrder);
  }

  /**
   * Apply non-status field updates to an order
   */
  private applyNonStatusUpdates(order: Order, updateOrderDto: UpdateOrderDto): void {
    if (updateOrderDto.paymentMethod !== undefined) {
      order.paymentMethod = updateOrderDto.paymentMethod;
    }
    if (updateOrderDto.paymentStatus !== undefined) {
      order.paymentStatus = updateOrderDto.paymentStatus;
    }
    if (updateOrderDto.paymentReference !== undefined) {
      order.paymentReference = updateOrderDto.paymentReference;
    }
    if (updateOrderDto.trackingCode !== undefined) {
      order.trackingCode = updateOrderDto.trackingCode;
    }
    if (updateOrderDto.notes !== undefined) {
      order.notes = updateOrderDto.notes;
    }
  }

  /**
   * Remove order (soft delete or hard delete - admin only)
   */
  async remove(id: number, userId: number, userRole: string): Promise<void> {
    const order = await this.ordersRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Only admins can delete orders
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admins can delete orders');
    }

    await this.ordersRepository.remove(order);
  }

  /**
   * Borra TODAS las órdenes (admin). Pensado para dejar la tienda en cero
   * después de las pruebas, no para uso rutinario.
   *
   * Se lleva los ítems, el historial de estados y las transacciones que las
   * órdenes generaron solas (COGS y comisión Payphone). NO toca productos,
   * usuarios ni stock: el stock que esas órdenes descontaron sigue descontado
   * y hay que ajustarlo a mano desde inventario.
   */
  async resetAll(): Promise<{
    ordersDeleted: number;
    itemsDeleted: number;
    transactionsDeleted: number;
  }> {
    return this.ordersRepository.manager.transaction(async (manager) => {
      const rows = async (sql: string): Promise<number> => {
        const res = await manager.query(sql);
        return Array.isArray(res) && typeof res[1] === 'number' ? res[1] : 0;
      };

      const transactionsDeleted = await rows(
        `DELETE FROM transactions WHERE "referenceType" LIKE 'order_%'`,
      );
      await rows('DELETE FROM order_status_history');
      const itemsDeleted = await rows('DELETE FROM order_items');
      const ordersDeleted = await rows('DELETE FROM orders');

      return { ordersDeleted, itemsDeleted, transactionsDeleted };
    });
  }

  /**
   * Create a manual order (admin only).
   *
   * El canal de venta manual es "clientes que llegan por redes": lo normal es
   * que no existan todavía como usuario, así que el admin captura sus datos aquí
   * y se les abre cuenta (o se reutiliza la que ya tenían por su correo).
   *
   * La venta se cierra en el acto: cobrada, stock descontado y COGS registrado.
   * El estado final depende de la entrega: con guía de Servientrega el pedido
   * queda en "Pagado" esperando despacho; entregado en mano se marca entregado.
   */
  async createManualOrder(dto: CreateManualOrderDto): Promise<OrderResponseDto> {
    const customer = await this.resolveManualSaleCustomer(dto);
    const needsShipment = requiresShipment(dto.deliveryMethod);
    // El costo del envío sale de la tabla del servidor, no del panel: la venta
    // manual cobra lo mismo que la tienda por la misma entrega.
    const deliveryCost = getDeliveryCost(dto.deliveryMethod);

    const orderDto: CreateOrderDto = {
      items: dto.items,
      paymentMethod: dto.paymentMethod,
      shippingAddress: customer.address,
      shippingCity: customer.city,
      notes: dto.notes || '[Venta manual]',
    };

    const created = await this.create(orderDto, customer.userId);

    // Descuento y envío antes de cerrar, para que el total guardado sea el que
    // se cobró: subtotal - descuento + envío.
    const discount = Math.max(0, dto.discountAmount ?? 0);
    if (discount > 0 || deliveryCost > 0) {
      const order = await this.ordersRepository.findOne({ where: { id: created.id } });
      if (order) {
        const subtotal = Number(order.subtotal ?? order.total);
        // El descuento queda registrado como tal y no rebajando el subtotal: si
        // no, el correo muestra subtotal y total que no cuadran entre sí.
        order.couponDiscount = discount;
        order.deliveryCost = deliveryCost;
        order.total = Math.max(0, subtotal - discount) + deliveryCost;
        await this.ordersRepository.save(order);
      }
    }

    const finalized = await this.finalizeManualSale(created.id, {
      customer,
      deliveryMethod: dto.deliveryMethod,
      needsShipment,
    });

    const data = this.buildOrderEmailData(finalized);

    // M-01 · confirmación de compra. El cliente de redes no pasó por el
    // checkout, así que este correo es su único comprobante.
    if (finalized.customerEmail) {
      this.emailService
        .sendOrderConfirmationEmail(data)
        .catch((err) =>
          console.error('[Orders] correo M-01 (venta manual) falló:', err?.message),
        );
    }

    // M-13 · alerta interna. Una venta manual es una orden como cualquier otra:
    // tiene que aparecer en el correo donde el admin lleva el control de pedidos.
    this.emailService
      .sendAdminNewOrderEmail(data)
      .catch((err) =>
        console.error('[Orders] correo M-13 (venta manual) falló:', err?.message),
      );

    return this.findOne(created.id, customer.userId);
  }

  /**
   * Resuelve a quién se le factura la venta manual: un cliente ya registrado o
   * uno nuevo capturado en el formulario. Con cliente nuevo se busca por correo
   * antes de crear nada —el mismo comprador puede haber comprado antes por la
   * web— y solo se crea la cuenta si no existe.
   */
  private async resolveManualSaleCustomer(
    dto: CreateManualOrderDto,
  ): Promise<ManualSaleCustomer> {
    const usersRepository = this.dataSource.getRepository(User);
    const input = dto.customer;

    let user: User | null = null;

    if (dto.userId) {
      user = await usersRepository.findOneBy({ id: dto.userId as any });
      if (!user) {
        throw new NotFoundException(`User with ID ${dto.userId} not found`);
      }
    } else {
      const email = input?.email?.trim();
      if (!email) {
        throw new BadRequestException(
          'Indica un cliente existente o los datos del cliente nuevo (nombre y correo).',
        );
      }

      user = await usersRepository
        .createQueryBuilder('u')
        .where('LOWER(u.email) = LOWER(:email)', { email })
        .getOne();

      if (!user) {
        const created = await this.usersService.createGuestAccount({
          email,
          firstName: input?.firstName?.trim() || 'Cliente',
          lastName: input?.lastName?.trim() || '',
        });
        user = created.user;
        // Sus credenciales: con ellas puede entrar a ver el pedido y comprar
        // después sin pasar de nuevo por el admin.
        this.emailService
          .sendGuestAccountEmail(email, user.firstName, created.plainPassword)
          .catch((err) =>
            console.error('[Orders] correo de cuenta (venta manual) falló:', err?.message),
          );
      }
    }

    // Completa la ficha del cliente con lo que el admin acaba de capturar, sin
    // pisar datos que el cliente ya tenía cargados en su cuenta.
    const patch: Partial<User> = {};
    const fill = (field: 'phone' | 'cedula' | 'city' | 'province' | 'address') => {
      const value = input?.[field]?.trim();
      if (value && !user![field]) patch[field] = value;
    };
    (['phone', 'cedula', 'city', 'province', 'address'] as const).forEach(fill);
    if (Object.keys(patch).length > 0) {
      await usersRepository.update(user.id as any, patch);
      Object.assign(user, patch);
    }

    const name =
      [input?.firstName?.trim() || user.firstName, input?.lastName?.trim() || user.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() || 'Cliente';

    return {
      userId: Number(user.id),
      name,
      email: (input?.email?.trim() || user.email) ?? '',
      phone: input?.phone?.trim() || user.phone || undefined,
      cedula: input?.cedula?.trim() || user.cedula || undefined,
      city: input?.city?.trim() || user.city || undefined,
      province: input?.province?.trim() || user.province || undefined,
      address: input?.address?.trim() || user.address || undefined,
    };
  }

  /**
   * Cierra la venta manual de forma atómica: cobrada, stock descontado, COGS
   * registrado y datos del comprador volcados en la orden. Con envío queda en
   * "Pagado" (la guía la carga el admin después y ahí sale el tracking); en
   * mano se marca entregada.
   */
  private async finalizeManualSale(
    orderId: number,
    opts: {
      customer: ManualSaleCustomer;
      deliveryMethod?: string;
      needsShipment: boolean;
    },
  ): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let saved: Order;

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items', 'items.product', 'items.productVariation'],
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      const now = new Date();
      const { customer } = opts;

      order.paymentStatus = 'paid';
      order.status = opts.needsShipment
        ? OrderStatus.RECEIVED
        : OrderStatus.DELIVERED;
      order.receivedAt = order.receivedAt ?? now;
      if (!opts.needsShipment) order.deliveredAt = now;

      order.customerName = customer.name;
      order.customerEmail = customer.email;
      order.customerPhone = customer.phone ?? order.customerPhone;
      order.customerCedula = customer.cedula ?? order.customerCedula;
      order.shippingAddress = customer.address ?? order.shippingAddress;
      order.shippingCity = customer.city ?? order.shippingCity;
      order.shippingProvince = customer.province ?? order.shippingProvince;
      if (opts.deliveryMethod) order.deliveryMethod = opts.deliveryMethod;

      await this.deductStockForOrder(order, queryRunner);
      await this.createCogsTransactionsForOrder(order, queryRunner, now);

      saved = await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Historial fuera de la transacción (no es crítico): deja rastro de que el
    // salto de estado lo hizo la venta manual y no un admin a mano.
    await this.recordStatusChange(
      orderId,
      OrderStatus.CREATED,
      saved.status,
      'Venta manual',
    ).catch(() => {});

    // Walletfy · la venta manual nace cobrada: sello de fidelidad de una vez.
    this.rewardWalletfy(saved);

    return saved;
  }

  /**
   * Suma el sello/puntos de la compra en Walletfy (tarjeta de fidelidad).
   * Fire-and-forget: un fallo de Walletfy jamás rompe el flujo de la orden.
   */
  private rewardWalletfy(order: Order): void {
    this.walletfyService
      .rewardOrder({
        name: order.customerName ?? '',
        email: order.customerEmail,
        phone: order.customerPhone,
        total: Number(order.total),
      })
      .catch((err) => console.error('[Orders] Walletfy falló:', err?.message));
  }
}

/** Datos del comprador ya resueltos para volcarlos en la orden manual. */
interface ManualSaleCustomer {
  userId: number;
  name: string;
  email: string;
  phone?: string;
  cedula?: string;
  city?: string;
  province?: string;
  address?: string;
}