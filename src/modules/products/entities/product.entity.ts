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
import { Marca } from '../../categories/entities/marca.entity';
import { ProductVariation } from './product-variation.entity';
import { ProductImage } from './product-image.entity';
import { ProductVideo } from './product-video.entity';

@Entity('products')
@Index(['name'])
@Index(['categoryId'])
@Index(['marcaId'])
export class Product {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  // Unit acquisition cost (used for COGS auto-expense on order fulfillment)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cost: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discount: number;

  @Column({ default: 0 })
  salesCount: number;

  @Column({ type: 'text', nullable: true })
  detailDescription: string;

  @Column({ type: 'text', nullable: true })
  benefits: string;

  // Usos comunes del producto (JSON array de strings) — acordeón "Usos comunes"
  // de la ficha, estilo minabaie ("Common Uses").
  @Column({ type: 'text', nullable: true })
  commonUses: string;

  // IDs de productos que combinan con este (JSON array de números) —
  // carrusel "Combina con" (Pairs With) de la ficha.
  @Column({ type: 'text', nullable: true })
  pairsWith: string;

  // Tallas disponibles (JSON array de strings, ej. ["Mini","Midi","Full"]) —
  // selector "Talla" de la ficha. Las variaciones siguen siendo los colores.
  @Column({ type: 'text', nullable: true })
  sizes: string;

  // Posts de Instagram de la ficha (JSON array de { url, image }) —
  // sección "Síguenos en Instagram" por producto.
  @Column({ type: 'text', nullable: true })
  instagramPosts: string;

  // Category relationships
  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'bigint' })
  categoryId: number;

  @ManyToOne(() => Marca)
  @JoinColumn({ name: 'subcategoryId' })
  marca: Marca;

  @Column({ name: 'subcategoryId', type: 'bigint' })
  marcaId: number;

  // Product variations (colores, tamaños, etc.)
  @OneToMany(() => ProductVariation, (variation) => variation.product)
  variations: ProductVariation[];

  // Product images. El orden de tienda se aplica al serializar (displayOrder).
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
