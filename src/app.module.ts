import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CartModule } from './modules/cart/cart.module';
import { BannersModule } from './modules/banners/banners.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CombosModule } from './modules/combos/combos.module';
import { FinanceModule } from './modules/finance/finance.module';
import { BlogModule } from './modules/blog/blog.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { ProductTypesModule } from './modules/product-types/product-types.module';
import { LandingSectionsModule } from './modules/landing-sections/landing-sections.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WalletfyModule } from './modules/walletfy/walletfy.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { HealthModule } from './modules/health/health.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ...(process.env.SKIP_DB_CONNECTION !== 'true'
      ? [
          TypeOrmModule.forRootAsync({
            useClass: DatabaseConfig,
          }) as any,
        ]
      : []),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    BannersModule,
    DashboardModule,
    CombosModule,
    FinanceModule,
    BlogModule,
    CouponsModule,
    ProductTypesModule,
    LandingSectionsModule,
    PaymentsModule,
    WalletfyModule,
    SettingsModule,
    NewsletterModule,
    ...(process.env.SKIP_DB_CONNECTION !== 'true' ? [HealthModule] : []),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
