import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Category } from '../categories/entities/category.entity';
import { Banner } from '../banners/entities/banner.entity';
import { Combo } from '../combos/entities/combo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, User, Order, Category, Banner, Combo])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
