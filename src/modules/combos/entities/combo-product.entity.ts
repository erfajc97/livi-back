import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Combo } from './combo.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariation } from '../../products/entities/product-variation.entity';

@Entity('combo_products')
export class ComboProduct {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  comboId: number;

  @Column({ type: 'bigint' })
  productId: number;

  @Column({ type: 'bigint', nullable: true })
  productVariationId: number;

  @Column({ default: 1 })
  quantity: number;

  @ManyToOne(() => Combo, (combo) => combo.comboProducts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comboId' })
  combo: Combo;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => ProductVariation, { nullable: true, eager: true })
  @JoinColumn({ name: 'productVariationId' })
  productVariation: ProductVariation;
}
