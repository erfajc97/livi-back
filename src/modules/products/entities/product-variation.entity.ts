import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductOptionValue } from './product-option-value.entity';
import { ProductVariationImage } from './product-variation-image.entity';
import { ProductVariationVideo } from './product-variation-video.entity';

@Entity('product_variations')
@Index(['productId'])
export class ProductVariation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Product, (product) => product.variations)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'bigint' })
  productId: number;

  // Variation-specific price (overrides base product price if set)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  // SKU for this specific variation
  @Column({ nullable: true, unique: true })
  sku: string;

  // Variation name/description (e.g., "XL - Green")
  @Column({ nullable: true })
  name: string;

  // Link to option values that define this variation
  @ManyToMany(() => ProductOptionValue)
  @JoinTable({
    name: 'product_variation_option_values',
    joinColumn: { name: 'variationId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'optionValueId', referencedColumnName: 'id' },
  })
  optionValues: ProductOptionValue[];

  // Decant size in ml (e.g., 3, 5, 10) or full bottle ml
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  mlSize: number;

  // Whether this variation represents a full sealed bottle
  @Column({ default: false })
  isFullBottle: boolean;

  @Column({ default: true })
  isActive: boolean;

  // Variation images
  @OneToMany(() => ProductVariationImage, (image) => image.variation)
  images: ProductVariationImage[];

  // Variation videos
  @OneToMany(() => ProductVariationVideo, (video) => video.variation)
  videos: ProductVariationVideo[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
