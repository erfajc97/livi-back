// Centralized entity imports to avoid Node.js 24 experimental TypeScript issues
import { User } from '../modules/users/entities/user.entity';
import { Product } from '../modules/products/entities/product.entity';
import { ProductOption } from '../modules/products/entities/product-option.entity';
import { ProductOptionValue } from '../modules/products/entities/product-option-value.entity';
import { ProductVariation } from '../modules/products/entities/product-variation.entity';
import { ProductImage } from '../modules/products/entities/product-image.entity';
import { ProductVideo } from '../modules/products/entities/product-video.entity';
import { ProductVariationImage } from '../modules/products/entities/product-variation-image.entity';
import { ProductVariationVideo } from '../modules/products/entities/product-variation-video.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { Subcategory } from '../modules/categories/entities/subcategory.entity';
import { Order } from '../modules/orders/entities/order.entity';
import { OrderItem } from '../modules/orders/entities/order-item.entity';
import { Cart } from '../modules/cart/entities/cart.entity';
import { CartItem } from '../modules/cart/entities/cart-item.entity';
import { Banner } from '../modules/banners/entities/banner.entity';
import { Combo } from '../modules/combos/entities/combo.entity';
import { ComboProduct } from '../modules/combos/entities/combo-product.entity';
import { Transaction } from '../modules/finance/entities/transaction.entity';
import { Bill } from '../modules/finance/entities/bill.entity';

export const entities = [
  User,
  Product,
  ProductOption,
  ProductOptionValue,
  ProductVariation,
  ProductImage,
  ProductVideo,
  ProductVariationImage,
  ProductVariationVideo,
  Category,
  Subcategory,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Banner,
  Combo,
  ComboProduct,
  Transaction,
  Bill,
];
