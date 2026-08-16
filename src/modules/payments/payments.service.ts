import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
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
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { OrderEmailData, OrderEmailItem } from '../email/email.types';

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
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  /**
   * Arma los datos del correo a partir de una orden ya guardada.
   *
   * Las líneas solo guardan ids, así que los nombres reales —y los ml del
   * decant— se resuelven acá; sin esto el cliente recibiría un detalle con
   * "Producto 12" en lugar del perfume que compró.
   */
  private async buildOrderEmailData(order: Order): Promise<OrderEmailData> {
    const items = order.items ?? [];
    const variationIds = items
      .map((i) => i.productVariationId)
      .filter((id): id is number => id != null);
    const productIds = items
      .map((i) => i.productId)
      .filter((id): id is number => id != null);

    const variations = variationIds.length
      ? await this.variationsRepository.find({
          where: { id: In(variationIds) },
          relations: ['product'],
        })
      : [];
    const products = productIds.length
      ? await this.productsRepository.find({ where: { id: In(productIds) } })
      : [];

    const variationById = new Map(variations.map((v) => [String(v.id), v]));
    const productById = new Map(products.map((p) => [String(p.id), p]));

    const emailItems: OrderEmailItem[] = items.map((item) => {
      const variation = item.productVariationId
        ? variationById.get(String(item.productVariationId))
        : undefined;
      const product =
        variation?.product ??
        (item.productId ? productById.get(String(item.productId)) : undefined);
      const ml = variation ? Number(variation.mlSize) : undefined;
      return {
        name: product?.name ?? 'Producto',
        quantity: item.quantity,
        price: Number(item.price),
        ml: ml && !variation?.isFullBottle ? ml : undefined,
        bajoPedidoQuantity: item.bajoPedidoQuantity
          ? Number(item.bajoPedidoQuantity)
          : undefined,
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
      items: emailItems,
    };
  }

  private generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `ND-${year}-${random}`;
  }

  /**
   * Vincula una orden guest a la cuenta del email del comprador: si ya existe
   * un usuario con ese email, adopta la orden (y cualquier otra huérfana con
   * el mismo email); si no existe, crea la cuenta con contraseña temporal y
   * se la envía por correo. Fire-and-forget desde el checkout.
   */
  private async claimGuestOrder(order: Order): Promise<void> {
    const email = order.customerEmail?.trim();
    if (!email) return;

    const existing = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('u')
      .where('LOWER(u.email) = LOWER(:email)', { email })
      .getOne();

    let userId: number;
    let credentials: { firstName: string; password: string } | null = null;

    if (existing) {
      userId = Number(existing.id);
    } else {
      const [firstName, ...rest] = (order.customerName || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const created = await this.usersService.createGuestAccount({
        email,
        firstName: firstName || 'Cliente',
        lastName: rest.join(' '),
      });
      userId = Number(created.user.id);
      credentials = {
        firstName: created.user.firstName,
        password: created.plainPassword,
      };
    }

    // Adopta esta orden y cualquier otra guest previa con el mismo email.
    await this.dataSource.query(
      `UPDATE "orders" SET "userId" = $1
       WHERE "userId" IS NULL AND LOWER("customerEmail") = LOWER($2)`,
      [userId, email],
    );

    if (credentials) {
      await this.emailService
        .sendGuestAccountEmail(email, credentials.firstName, credentials.password)
        .catch(() => {});
    }
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

      // Guest checkout: la orden llega sin dueño. Se vincula a la cuenta del
      // email del comprador (creándola con contraseña temporal la primera
      // vez y enviándosela por correo). Best-effort: nunca rompe la compra.
      if (!user && savedOrder.customerEmail) {
        this.claimGuestOrder(savedOrder).catch(() => {});
      }

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

      // M-00 · Acuse al cliente. Con tarjeta el acuse se manda al aprobarse el
      // pago (M-01), pero con efectivo nadie le confirmaba nada: se quedaba sin
      // constancia hasta que un admin revisara el comprobante.
      // La transferencia queda fuera: su acuse es M-02, que sale al subir el
      // comprobante —paso obligatorio del checkout, segundos después—, y mandar
      // los dos le llegaba al cliente como pedido duplicado.
      const isTransfer = dto.paymentMethod === 'TRANSFERENCIA';
      if (!isPayphone && !isTransfer && savedOrder.customerEmail) {
        this.buildOrderEmailData(savedOrder)
          .then((data) => this.emailService.sendOrderPlacedEmail(data))
          .catch((err) =>
            console.error('[Payments] M-00 acuse de pedido falló:', err?.message),
          );
      }

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

      // M-01 · Confirmación al cliente. En segundo plano: el pago ya está hecho
      // y un fallo de correo no puede tumbar la respuesta. El corte por
      // idempotencia de arriba evita que se mande dos veces.
      this.buildOrderEmailData(order)
        .then((data) => this.emailService.sendOrderConfirmationEmail(data))
        .catch((err) =>
          console.error('[Payments] M-01 confirmación falló:', err?.message),
        );
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
    customerEmail?: string,
  ) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId as any },
      relations: ['items'],
    });

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    // Quien compra sin sesión igual termina siendo dueño de su orden: al crearla
    // se le abre una cuenta automática y la orden queda con ese `userId`. Pedir
    // sesión para subir el comprobante dejaba al invitado fuera de su propia
    // compra, así que también vale demostrar que es suyo con el correo del
    // pedido —dato que solo tiene quien acaba de comprar—.
    const isAdmin = user?.role === 'admin';
    const isOwner =
      user != null && order.userId != null && Number(order.userId) === Number(user.id);
    const emailMatches =
      !!customerEmail &&
      !!order.customerEmail &&
      customerEmail.trim().toLowerCase() === order.customerEmail.trim().toLowerCase();

    if (!isAdmin && !isOwner && !emailMatches) {
      throw new BadRequestException(
        'No pudimos verificar que este pedido sea tuyo. Inicia sesión o vuelve a intentarlo desde el checkout.',
      );
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

    // M-02 · Acuse al cliente: su orden quedó registrada y se procesa cuando el
    // pago se valide. Va en segundo plano, igual que el resto de la matriz.
    this.buildOrderEmailData(order)
      .then((data) => this.emailService.sendTransferReceivedEmail(data))
      .catch((err) =>
        console.error('[Payments] M-02 acuse de transferencia falló:', err?.message),
      );

    return new OrderResponseDto(order);
  }
}
