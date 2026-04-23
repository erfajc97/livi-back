import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { Order } from '../../modules/orders/entities/order.entity';
import { OrderItem } from '../../modules/orders/entities/order-item.entity';
import { Product } from '../../modules/products/entities/product.entity';
import { User } from '../../modules/users/entities/user.entity';
import { OrderStatus } from '../../common/constants/order-status.enum';

export class OrdersSeeder extends BaseSeeder {
  async seed(dataSource: DataSource): Promise<void> {
    const orderRepository = dataSource.getRepository(Order);
    const orderItemRepository = dataSource.getRepository(OrderItem);
    const productRepository = dataSource.getRepository(Product);
    const userRepository = dataSource.getRepository(User);

    const existingOrders = await orderRepository.find();
    if (existingOrders.length > 0) {
      console.log(`  - Found ${existingOrders.length} existing orders, skipping seeder`);
      return;
    }

    // Get clients
    const clients = await userRepository.find({ where: { role: 'client' as any } });
    if (clients.length === 0) {
      console.log('  - No client users found, skipping orders seeder');
      return;
    }

    // Get products (no parent = base products)
    const products = await productRepository.find({
      take: 20,
      order: { id: 'ASC' },
    });

    if (products.length < 5) {
      console.log('  - Not enough products, skipping orders seeder');
      return;
    }

    const paymentMethods = ['Efectivo', 'Transferencia', 'Tarjeta'];
    const paymentStatuses = ['paid', 'pending', 'refunded'];

    const statuses = [
      OrderStatus.CREATED,
      OrderStatus.RECEIVED,
      OrderStatus.ACCEPTED,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.DELIVERED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];

    const now = new Date();
    const orders: Array<{
      userId: number;
      status: OrderStatus;
      paymentMethod: string;
      paymentStatus: string;
      notes?: string;
      daysAgo: number;
      items: Array<{ productId: number; price: number; quantity: number }>;
    }> = [];

    // Generate 15 orders spread over the last 30 days
    for (let i = 0; i < 15; i++) {
      const client = clients[i % clients.length];
      const status = statuses[i % statuses.length];
      const daysAgo = Math.floor(Math.random() * 30);
      const numItems = 1 + Math.floor(Math.random() * 3);

      const items: Array<{ productId: number; price: number; quantity: number }> = [];
      const usedProductIds = new Set<number>();

      for (let j = 0; j < numItems; j++) {
        let product = products[Math.floor(Math.random() * products.length)];
        // Avoid duplicate products in same order
        while (usedProductIds.has(product.id)) {
          product = products[Math.floor(Math.random() * products.length)];
        }
        usedProductIds.add(product.id);

        items.push({
          productId: product.id,
          price: Number(product.price),
          quantity: 1 + Math.floor(Math.random() * 2),
        });
      }

      orders.push({
        userId: client.id,
        status,
        paymentMethod: paymentMethods[i % paymentMethods.length],
        paymentStatus: status === OrderStatus.DELIVERED || status === OrderStatus.SHIPPED
          ? 'paid'
          : status === OrderStatus.CANCELLED
            ? 'refunded'
            : paymentStatuses[i % paymentStatuses.length],
        notes: i % 4 === 0 ? 'Venta manual desde admin' : undefined,
        daysAgo,
        items,
      });
    }

    for (const orderData of orders) {
      const total = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const createdAt = new Date(now.getTime() - orderData.daysAgo * 24 * 60 * 60 * 1000);
      const year = createdAt.getFullYear();
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const orderNumber = `ORD-${year}-${random}`;

      const timestamps: Record<string, Date> = {};
      if ([OrderStatus.RECEIVED, OrderStatus.ACCEPTED, OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(orderData.status)) {
        timestamps.receivedAt = new Date(createdAt.getTime() + 1 * 60 * 60 * 1000);
      }
      if ([OrderStatus.ACCEPTED, OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(orderData.status)) {
        timestamps.acceptedAt = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
      }
      if ([OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(orderData.status)) {
        timestamps.shippedAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
      }
      if (orderData.status === OrderStatus.DELIVERED) {
        timestamps.deliveredAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);
      }
      if (orderData.status === OrderStatus.CANCELLED) {
        timestamps.cancelledAt = new Date(createdAt.getTime() + 30 * 60 * 1000);
      }

      const order = orderRepository.create({
        orderNumber,
        userId: orderData.userId,
        status: orderData.status,
        total,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus,
        notes: orderData.notes,
        createdAt,
        ...timestamps,
      });

      const savedOrder = await orderRepository.save(order);

      const orderItems = orderData.items.map((item) =>
        orderItemRepository.create({
          orderId: savedOrder.id,
          productId: item.productId,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        }),
      );
      await orderItemRepository.save(orderItems);
    }

    const totalOrders = await orderRepository.count();
    console.log('✓ Orders seeded');
    console.log(`  - Created ${orders.length} orders`);
    console.log(`  - Total orders: ${totalOrders}`);
  }
}
