// Centralized entity imports to avoid Node.js 24 experimental TypeScript issues
import { User } from '../modules/users/entities/user.entity';
import { UserAddress } from '../modules/users/entities/user-address.entity';
import { Product } from '../modules/products/entities/product.entity';
import { ProductOption } from '../modules/products/entities/product-option.entity';
import { ProductOptionValue } from '../modules/products/entities/product-option-value.entity';
import { ProductVariation } from '../modules/products/entities/product-variation.entity';
import { ProductImage } from '../modules/products/entities/product-image.entity';
import { ProductVideo } from '../modules/products/entities/product-video.entity';
import { ProductVariationImage } from '../modules/products/entities/product-variation-image.entity';
import { ProductVariationVideo } from '../modules/products/entities/product-variation-video.entity';
import { BottleEvent } from '../modules/products/entities/bottle-event.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { Marca } from '../modules/categories/entities/marca.entity';
import { Order } from '../modules/orders/entities/order.entity';
import { OrderItem } from '../modules/orders/entities/order-item.entity';
import { OrderStatusHistory } from '../modules/orders/entities/order-status-history.entity';
import { Cart } from '../modules/cart/entities/cart.entity';
import { CartItem } from '../modules/cart/entities/cart-item.entity';
import { Banner } from '../modules/banners/entities/banner.entity';
import { Combo } from '../modules/combos/entities/combo.entity';
import { ComboProduct } from '../modules/combos/entities/combo-product.entity';
import { Transaction } from '../modules/finance/entities/transaction.entity';
import { Bill } from '../modules/finance/entities/bill.entity';
import { PaymentMethod } from '../modules/finance/entities/payment-method.entity';
import { ProductTypeEntity } from '../modules/product-types/entities/product-type.entity';
import { BlogPost } from '../modules/blog/entities/blog-post.entity';
import { Coupon } from '../modules/coupons/entities/coupon.entity';
import { CouponUsage } from '../modules/coupons/entities/coupon-usage.entity';
import { LandingSection } from '../modules/landing-sections/entities/landing-section.entity';
import { Setting } from '../modules/settings/entities/setting.entity';
import { Subscriber } from '../modules/newsletter/entities/subscriber.entity';
import { Campaign } from '../modules/newsletter/entities/campaign.entity';

export const entities = [
  User,
  UserAddress,
  Product,
  ProductOption,
  ProductOptionValue,
  ProductVariation,
  ProductImage,
  ProductVideo,
  ProductVariationImage,
  ProductVariationVideo,
  BottleEvent,
  Category,
  Marca,
  Cart,
  CartItem,
  Order,
  OrderItem,
  OrderStatusHistory,
  Banner,
  Combo,
  ComboProduct,
  Transaction,
  Bill,
  PaymentMethod,
  ProductTypeEntity,
  BlogPost,
  Coupon,
  CouponUsage,
  LandingSection,
  Setting,
  Subscriber,
  Campaign,
];
