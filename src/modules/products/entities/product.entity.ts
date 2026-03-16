import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Subcategory } from '../../categories/entities/subcategory.entity';
import { ProductVariation } from './product-variation.entity';
import { ProductImage } from './product-image.entity';
import { ProductVideo } from './product-video.entity';

export enum ProductType {
  PERFUME = 'perfume',
  // Add more product types as needed
  // COSMETICS = 'cosmetics',
  // SKINCARE = 'skincare',
}

export enum MeasureUnit {
  ML = 'ml',
  OZ = 'oz',
  G = 'g',
  KG = 'kg',
  // Add more units as needed
}

@Entity('products')
@Index(['brand', 'name'])
@Index(['categoryId'])
@Index(['subcategoryId'])
export class Product {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  name: string;

  @Column()
  brand: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: ProductType })
  type: ProductType;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: true })
  isActive: boolean;

  // Measurement fields (for perfumes: ml, oz, etc.)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  measureValue: number;

  @Column({ type: 'enum', enum: MeasureUnit, nullable: true })
  measureUnit: MeasureUnit;

  // Category relationships
  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'bigint' })
  categoryId: number;

  @ManyToOne(() => Subcategory)
  @JoinColumn({ name: 'subcategoryId' })
  subcategory: Subcategory;

  @Column({ type: 'bigint' })
  subcategoryId: number;

  // Decant relationship (self-referential)
  // If this is a decant, parentProductId points to the original product
  @ManyToOne(() => Product, (product) => product.decants, { nullable: true })
  @JoinColumn({ name: 'parentProductId' })
  parentProduct: Product;

  @Column({ type: 'bigint', nullable: true })
  parentProductId: number;

  @OneToMany(() => Product, (product) => product.parentProduct)
  decants: Product[];

  // Product variations (size, color, etc.)
  @OneToMany(() => ProductVariation, (variation) => variation.product)
  variations: ProductVariation[];

  // Product images
  @OneToMany(() => ProductImage, (image) => image.product)
  images: ProductImage[];

  // Product videos
  @OneToMany(() => ProductVideo, (video) => video.product)
  videos: ProductVideo[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
