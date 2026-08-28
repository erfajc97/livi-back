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

/**
 * Tipo de presentación de la variante (REQ-056):
 *  - decant:   decant fraccionado (3/5/10 ml…) — sale de la botella abierta.
 *  - sellada:  botella sellada del formato estándar del producto (totalMl).
 *  - original: presentación original alternativa (50ml, 100ml, etc.).
 * `isFullBottle` sigue gobernando la lógica de inventario (sellada/original = true);
 * este campo es la clasificación que elige el admin y que ve el cliente.
 */
export enum PresentationType {
  DECANT = 'decant',
  SELLADA = 'sellada',
  ORIGINAL = 'original',
}

@Entity('product_variations')
@Index(['productId'])
export class ProductVariation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Product, (product) => product.variations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'bigint' })
  productId: number;

  // Variation-specific price (overrides base product price if set)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  // Variation-specific acquisition cost (overrides base product cost if set)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number;

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
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  mlSize: number;

  // Whether this variation represents a full sealed bottle
  @Column({ default: false })
  isFullBottle: boolean;

  // Presentation type chosen in the admin (decant / sellada / original)
  @Column({ type: 'enum', enum: PresentationType, default: PresentationType.DECANT })
  presentationType: PresentationType;

  @Column({ default: true })
  isActive: boolean;

  // Variation images. El orden de tienda se aplica al serializar (displayOrder).
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
