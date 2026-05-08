import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariation } from '../../products/entities/product-variation.entity';

@Entity('order_items')
@Index(['orderId'])
@Index(['productId'])
@Index(['productVariationId'])
export class OrderItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'bigint' })
  orderId: number;

  // Reference to Product (if ordering base product)
  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'bigint', nullable: true })
  productId: number;

  // Reference to ProductVariation (if ordering a specific variation)
  @ManyToOne(() => ProductVariation, { nullable: true })
  @JoinColumn({ name: 'productVariationId' })
  productVariation: ProductVariation;

  @Column({ type: 'bigint', nullable: true })
  productVariationId: number;

  // Price snapshot at time of order (to preserve historical pricing)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  // Cost snapshot at time of order (preserves COGS even if product cost changes later)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  costSnapshot: number;

  // Quantity ordered
  @Column()
  quantity: number;

  // Subtotal for this item (price * quantity)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  // Total ml deducted from open bottle (for decant orders, used in cancellation restoration)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  mlDeducted: number;

  // Number of sealed bottles opened to fulfill this order item
  @Column({ default: 0 })
  bottlesOpened: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}