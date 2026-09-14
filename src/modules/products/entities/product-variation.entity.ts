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

  // Variation name/description (e.g., "Negro", "Espresso")
  @Column({ nullable: true })
  name: string;

  // Color del swatch en hexadecimal (ej. "#12100E"). Lo define el admin con
  // un picker; si falta, el front cae al mapa por nombre.
  @Column({ nullable: true })
  colorHex: string;

  // Talla de la variante (ej. "Midi"). Una variante es la combinación
  // color (name) + talla (size); NULL = la variante no tiene talla.
  @Column({ nullable: true })
  size: string;

  // Link to option values that define this variation
  @ManyToMany(() => ProductOptionValue)
  @JoinTable({
    name: 'product_variation_option_values',
    joinColumn: { name: 'variationId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'optionValueId', referencedColumnName: 'id' },
  })
  optionValues: ProductOptionValue[];

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
