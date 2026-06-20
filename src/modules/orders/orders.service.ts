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
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { OrderStatus } from '../../common/constants/order-status.enum';
import { CartService } from '../cart/cart.service';
import { StockService } from '../products/stock.service';

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
  ) {}

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
    return `ORD-${year}-${random}`;
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
      // Demanda de decants acumulada por producto (ml). Los decants NO entran
      // a bajo pedido: solo se venden si hay frasco disponible para abrir.
      const decantDemand = new Map<number, { product: Product; ml: number }>();

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

          // Stock: el frasco completo SIEMPRE se puede pedir. Si no queda stock
          // sellado, el excedente se importa bajo pedido (se calcula y registra
          // como bajoPedidoQuantity al confirmar el pago). Los decants NO van
          // bajo pedido: se acumulan para validar contra el ml disponible.
          if (!productVariation.isFullBottle) {
            const ml = Number(productVariation.mlSize || 0) * itemDto.quantity;
            const prev = decantDemand.get(product.id);
            decantDemand.set(product.id, { product, ml: (prev?.ml ?? 0) + ml });
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
          const fullBottleVariation = activeVariations.find((v) => v.isFullBottle);

          if (fullBottleVariation) {
            // Treat productId-only as full-bottle sale through the variation
            price = Number(fullBottleVariation.price || product.price);
            productId = product.id;
            productVariationId = fullBottleVariation.id;
            productVariation = fullBottleVariation;
          } else if (activeVariations.length > 0) {
            // Product has only decant variations — caller must specify one
            throw new BadRequestException(
              `Product with ID ${itemDto.productId} has variations. You must order a specific variation instead of the base product. Available variations: ${activeVariations.map((v) => v.id).join(', ')}`,
            );
          } else {
            // No variations at all — legacy path, sell the base product. El
            // frasco siempre se puede pedir; el excedente se importa bajo pedido.
            price = product.price;
            productId = product.id;
          }
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

      // Validar decants: nunca permitir más ml de los disponibles. A diferencia
      // del frasco completo, los decants NO se pueden pedir bajo pedido.
      for (const { product: p, ml } of decantDemand.values()) {
        const availableMl = this.stockService.getAvailableMl(p);
        if (availableMl < ml) {
          throw new BadRequestException(
            `No hay suficiente stock para preparar los decants de "${p.name}". ` +
              `Disponible: ${availableMl} ml, solicitado: ${ml} ml.`,
          );
        }
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
    for (const item of order.items) {
      if (item.stockDeductedAt) {
        console.log(`[StockDeduction] Item ${item.id} already deducted at ${item.stockDeductedAt} — skipping`);
        continue;
      }
      console.log(`[StockDeduction] Item: productId=${item.productId}, variationId=${item.productVariationId}, qty=${item.quantity}`);
      if (item.productVariationId) {
        const variation = await this.productVariationsRepository.findOne({
          where: { id: item.productVariationId },
          relations: ['product'],
        });

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
   * Restore stock for all items in an order using a transaction.
   */
  private async restoreStockForOrder(
    order: Order,
    queryRunner: import('typeorm').QueryRunner,
  ): Promise<void> {
    for (const item of order.items) {
      if (item.productVariationId) {
        const variation = await this.productVariationsRepository.findOne({
          where: { id: item.productVariationId },
          relations: ['product'],
        });

        if (!variation || !variation.product) continue;

        if (variation.isFullBottle) {
          await this.stockService.restoreFullBottleStock(
            variation.product,
            item.quantity,
            queryRunner,
          );
        } else if (item.mlDeducted && Number(item.mlDeducted) > 0) {
          await this.stockService.restoreDecantStock(
            variation.product,
            Number(item.mlDeducted),
            queryRunner,
          );
        }
      } else if (item.productId) {
        // Full bottle — restore sealed stock
        const product = await this.productsRepository.findOne({
          where: { id: item.productId },
        });

        if (product) {
          await this.stockService.restoreFullBottleStock(
            product,
            item.quantity,
            queryRunner,
          );
        }
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

        // Record status change in history (outside transaction, non-critical)
        await this.recordStatusChange(
          order.id,
          previousStatus,
          updateOrderDto.status!,
          userName || (userRole === 'admin' ? 'Administrador' : 'Cliente'),
          updateOrderDto.statusNote,
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
   * Create a manual order on behalf of a client (admin only).
   * Manual sales are finalized immediately: paid, delivered, stock deducted,
   * COGS recorded. No customer-facing notifications are sent.
   */
  async createManualOrder(dto: CreateManualOrderDto): Promise<OrderResponseDto> {
    const user = await this.dataSource.getRepository('User').findOneBy({ id: dto.userId });

    const orderDto: CreateOrderDto = {
      items: dto.items,
      paymentMethod: dto.paymentMethod,
      shippingAddress: (user as any)?.address || undefined,
      shippingCity: (user as any)?.city || undefined,
      notes: dto.notes || '[Venta manual]',
    };

    const created = await this.create(orderDto, dto.userId);

    // Apply discount before finalizing so the recorded total reflects what was charged
    if (dto.discountAmount && dto.discountAmount > 0) {
      const order = await this.ordersRepository.findOne({ where: { id: created.id } });
      if (order) {
        order.total = Math.max(0, Number(order.total) - dto.discountAmount);
        await this.ordersRepository.save(order);
      }
    }

    await this.finalizeManualSale(created.id);

    return this.findOne(created.id, dto.userId);
  }

  /**
   * Mark a manual sale as paid + delivered, deduct stock, and create COGS
   * transactions atomically. Skips customer notifications by design.
   */
  private async finalizeManualSale(orderId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items', 'items.product', 'items.productVariation'],
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      const now = new Date();
      order.paymentStatus = 'paid';
      order.status = OrderStatus.DELIVERED;
      order.receivedAt = order.receivedAt ?? now;
      order.deliveredAt = now;

      await this.deductStockForOrder(order, queryRunner);
      await this.createCogsTransactionsForOrder(order, queryRunner, now);

      await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}