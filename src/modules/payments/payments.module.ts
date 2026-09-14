import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PayPhoneService } from './payphone.service';
import { CloudinaryService } from '../../common/services/cloudinary.service';
import { OrderNotificationService } from '../../common/services/order-notification.service';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariation } from '../products/entities/product-variation.entity';
import { OrderStatusHistory } from '../orders/entities/order-status-history.entity';
import { ProductsModule } from '../products/products.module';
import { CouponsModule } from '../coupons/coupons.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderStatusHistory, Product, ProductVariation]),
    ProductsModule,
    CouponsModule,
    UsersModule,
    EmailModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PayPhoneService, CloudinaryService, OrderNotificationService],
  exports: [PaymentsService, PayPhoneService],
})
export class PaymentsModule {}
