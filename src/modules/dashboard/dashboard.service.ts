import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
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
    const [
      totalProducts,
      totalDecants,
      totalUsers,
      totalClients,
      totalOrders,
      totalCategories,
      totalBanners,
      visibleBanners,
      totalCombos,
      activeCombos,
    ] = await Promise.all([
      this.productsRepository.count({ where: { parentProductId: IsNull() } }),
      this.productsRepository.count({ where: { parentProductId: Not(IsNull()) } }),
      this.usersRepository.count(),
      this.usersRepository.count({ where: { role: Role.CLIENT } }),
      this.ordersRepository.count(),
      this.categoriesRepository.count(),
      this.bannersRepository.count(),
      this.bannersRepository.count({ where: { isVisible: true } }),
      this.combosRepository.count(),
      this.combosRepository.count({ where: { isActive: true } }),
    ]);

    // Calculate total stock from all products
    const stockResult = await this.productsRepository
      .createQueryBuilder('product')
      .select('SUM(product.stock)', 'totalStock')
      .where('product.parentProductId IS NULL')
      .getRawOne();

    const totalStock = parseInt(stockResult?.totalStock || '0', 10);

    // Low stock products (stock < 10)
    const lowStockCount = await this.productsRepository
      .createQueryBuilder('product')
      .where('product.parentProductId IS NULL')
      .andWhere('product.stock < :threshold', { threshold: 10 })
      .getCount();

    const maxStock = totalProducts * 400;

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

    // Revenue from delivered orders
    const revenueResult = await this.ordersRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total), 0)', 'totalRevenue')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();

    const totalRevenue = parseFloat(revenueResult?.totalRevenue || '0');

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
        : 'Cliente',
      paymentMethod: order.paymentMethod || 'N/A',
      paymentStatus: order.paymentStatus || 'N/A',
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
    }));

    return {
      products: {
        total: totalProducts,
        decants: totalDecants,
      },
      stock: {
        available: totalStock,
        capacity: maxStock,
        lowStock: lowStockCount,
      },
      users: {
        total: totalUsers,
        clients: totalClients,
      },
      orders: {
        total: totalOrders,
        revenue: totalRevenue,
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
