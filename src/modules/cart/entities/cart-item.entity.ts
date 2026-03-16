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
import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariation } from '../../products/entities/product-variation.entity';

@Entity('cart_items')
@Index(['cartId'])
@Index(['productId'])
@Index(['productVariationId'])
export class CartItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart: Cart;

  @Column({ type: 'bigint' })
  cartId: number;

  // Reference to Product (if adding base product to cart)
  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'bigint', nullable: true })
  productId: number;

  // Reference to ProductVariation (if adding a specific variation to cart)
  @ManyToOne(() => ProductVariation, { nullable: true })
  @JoinColumn({ name: 'productVariationId' })
  productVariation: ProductVariation;

  @Column({ type: 'bigint', nullable: true })
  productVariationId: number;

  // Quantity in cart
  @Column()
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}