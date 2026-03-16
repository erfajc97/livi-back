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
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateManualOrderDto } from './dto/create-manual-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderStatus } from '../../common/constants/order-status.enum';
import { CartService } from '../cart/cart.service';

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
    private dataSource: DataSource,
    private cartService: CartService,
  ) {}

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

          // Check stock
          if (productVariation.stock < itemDto.quantity) {
            throw new BadRequestException(
              `Insufficient stock for variation ${itemDto.productVariationId}. Available: ${productVariation.stock}, Requested: ${itemDto.quantity}`,
            );
          }
          price = productVariation.price || product.price;
          productId = product.id;
          productVariationId = productVariation.id;

          // Update stock
          productVariation.stock -= itemDto.quantity;
          await queryRunner.manager.save(ProductVariation, productVariation);
        } else if (itemDto.productId) {
          // Ordering base product
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

          // Check if product has variations - if it does, user must order a variation
          const activeVariations = product.variations?.filter((v) => v.isActive) || [];
          if (activeVariations.length > 0) {
            throw new BadRequestException(
              `Product with ID ${itemDto.productId} has variations. You must order a specific variation instead of the base product. Available variations: ${activeVariations.map((v) => v.id).join(', ')}`,
            );
          }

          // Check stock
          if (product.stock < itemDto.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product ${itemDto.productId}. Available: ${product.stock}, Requested: ${itemDto.quantity}`,
            );
          }

          price = product.price;
          productId = product.id;

          // Update stock
          product.stock -= itemDto.quantity;
          await queryRunner.manager.save(Product, product);
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

        // Create order item with proper handling of nullable fields
        const orderItemData: any = {
          price: Number(price),
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

      // Create order
      const orderNumber = this.generateOrderNumber();
      const order = queryRunner.manager.create(Order, {
        orderNumber,
        userId,
        status: OrderStatus.CREATED,
        total,
        paymentMethod: createOrderDto.paymentMethod,
        shippingAddress: createOrderDto.shippingAddress,
        shippingCity: createOrderDto.shippingCity,
        shippingPostalCode: createOrderDto.shippingPostalCode,
        shippingCountry: createOrderDto.shippingCountry,
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
      relations: ['items', 'user'],
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
      relations: ['items'],
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
   * Update order (admin only for status changes, user can update their own orders in certain states)
   */
  async update(
    id: number,
    updateOrderDto: UpdateOrderDto,
    userId: number,
    userRole: string,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items'],
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

    // Update status and set corresponding timestamp
    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
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
          // TODO: Restore stock when order is cancelled
          break;
        case OrderStatus.DELAYED:
          // Delay doesn't have a specific timestamp, but we can track it in notes
          break;
      }

      order.status = updateOrderDto.status;
    }

    // Update other fields
    if (updateOrderDto.paymentMethod !== undefined) {
      order.paymentMethod = updateOrderDto.paymentMethod;
    }
    if (updateOrderDto.paymentStatus !== undefined) {
      order.paymentStatus = updateOrderDto.paymentStatus;
    }
    if (updateOrderDto.paymentReference !== undefined) {
      order.paymentReference = updateOrderDto.paymentReference;
    }
    if (updateOrderDto.notes !== undefined) {
      order.notes = updateOrderDto.notes;
    }

    const updatedOrder = await this.ordersRepository.save(order);
    return new OrderResponseDto(updatedOrder);
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
   * Create a manual order on behalf of a client (admin only)
   */
  async createManualOrder(dto: CreateManualOrderDto): Promise<OrderResponseDto> {
    const orderDto: CreateOrderDto = {
      items: dto.items,
      paymentMethod: dto.paymentMethod,
      notes: dto.notes ? `[Venta manual] ${dto.notes}` : '[Venta manual]',
    };

    const order = await this.create(orderDto, dto.userId);

    // Apply discount if provided
    if (dto.discountAmount && dto.discountAmount > 0) {
      const savedOrder = await this.ordersRepository.findOne({
        where: { id: order.id },
        relations: ['items'],
      });
      if (savedOrder) {
        savedOrder.total = Math.max(0, Number(savedOrder.total) - dto.discountAmount);
        await this.ordersRepository.save(savedOrder);
        return new OrderResponseDto(savedOrder);
      }
    }

    return order;
  }
}