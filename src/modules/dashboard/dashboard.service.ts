import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Category } from '../categories/entities/category.entity';
import { Banner } from '../banners/entities/banner.entity';
import { Combo } from '../combos/entities/combo.entity';
import { Role } from '../../common/constants/roles.enum';
import { OrderStatus } from '../../common/constants/order-status.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Banner)
    private bannersRepository: Repository<Banner>,
    @InjectRepository(Combo)
    private combosRepository: Repository<Combo>,
  ) {}

  async getStats() {
    // Today at midnight (UTC-5 Ecuador)
    const now = new Date();
    const ecuadorOffset = -5 * 60 * 60 * 1000;
    const ecuadorNow = new Date(now.getTime() + ecuadorOffset);
    const todayStart = new Date(Date.UTC(
      ecuadorNow.getUTCFullYear(),
      ecuadorNow.getUTCMonth(),
      ecuadorNow.getUTCDate(),
    ));
    // Convert back to UTC for DB query
    const todayStartUTC = new Date(todayStart.getTime() - ecuadorOffset);

    const [
      totalProducts,
      totalUsers,
      totalClients,
      totalOrders,
      totalCategories,
      totalBanners,
      visibleBanners,
      totalCombos,
      activeCombos,
    ] = await Promise.all([
      this.productsRepository.count(),
      this.usersRepository.count(),
      this.usersRepository.count({ where: { role: Role.CLIENT } }),
      this.ordersRepository.count(),
      this.categoriesRepository.count(),
      this.bannersRepository.count(),
      this.bannersRepository.count({ where: { isVisible: true } }),
      this.combosRepository.count(),
      this.combosRepository.count({ where: { isActive: true } }),
    ]);

    // Stock
    const stockResult = await this.productsRepository
      .createQueryBuilder('product')
      .select('SUM(product.stock)', 'totalStock')
      .getRawOne();
    const totalStock = parseInt(stockResult?.totalStock || '0', 10);

    const lowStockCount = await this.productsRepository
      .createQueryBuilder('product')
      .where('product.stock < :threshold AND product.stock > 0', { threshold: 10 })
      .getCount();

    // Order status breakdown
    const orderStatusCounts = await this.ordersRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    const statusMap: Record<string, number> = {};
    for (const row of orderStatusCounts) {
      statusMap[row.status] = parseInt(row.count, 10);
    }

    // Revenue total (all delivered orders)
    const totalRevenueResult = await this.ordersRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total), 0)', 'revenue')
      .addSelect('COUNT(*)', 'count')
      .where('order.status IN (:...paidStatuses)', {
        paidStatuses: [OrderStatus.RECEIVED, OrderStatus.ACCEPTED, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
      })
      .getRawOne();

    const totalRevenue = parseFloat(totalRevenueResult?.revenue || '0');
    const totalPaidOrders = parseInt(totalRevenueResult?.count || '0', 10);

    // Revenue today (orders created today that are paid/delivered)
    const todayRevenueResult = await this.ordersRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total), 0)', 'revenue')
      .addSelect('COUNT(*)', 'count')
      .where('order.createdAt >= :todayStart', { todayStart: todayStartUTC })
      .andWhere('order.status IN (:...paidStatuses)', {
        paidStatuses: [OrderStatus.RECEIVED, OrderStatus.ACCEPTED, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
      })
      .getRawOne();

    const todayRevenue = parseFloat(todayRevenueResult?.revenue || '0');
    const todayOrders = parseInt(todayRevenueResult?.count || '0', 10);

    // Recent orders (last 10)
    const recentOrders = await this.ordersRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const recentOrdersData = recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      clientName: order.user
        ? `${order.user.firstName} ${order.user.lastName}`
        : order.customerName || 'Cliente',
      paymentMethod: order.paymentMethod || 'N/A',
      paymentStatus: order.paymentStatus || 'N/A',
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
    }));

    return {
      products: {
        total: totalProducts,
      },
      stock: {
        available: totalStock,
        lowStock: lowStockCount,
      },
      users: {
        total: totalUsers,
        clients: totalClients,
      },
      orders: {
        total: totalOrders,
        totalRevenue,
        totalPaidOrders,
        todayRevenue,
        todayOrders,
        byStatus: {
          pending: statusMap[OrderStatus.CREATED] || 0,
          paid: statusMap[OrderStatus.RECEIVED] || 0,
          accepted: statusMap[OrderStatus.ACCEPTED] || 0,
          shipped: statusMap[OrderStatus.SHIPPED] || 0,
          delivered: statusMap[OrderStatus.DELIVERED] || 0,
          cancelled: statusMap[OrderStatus.CANCELLED] || 0,
          delayed: statusMap[OrderStatus.DELAYED] || 0,
          rejected: statusMap[OrderStatus.REJECTED] || 0,
        },
        recent: recentOrdersData,
      },
      categories: {
        total: totalCategories,
      },
      banners: {
        total: totalBanners,
        visible: visibleBanners,
      },
      combos: {
        total: totalCombos,
        active: activeCombos,
      },
    };
  }
}
