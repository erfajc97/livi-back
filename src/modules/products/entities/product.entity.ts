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

export enum Gender {
  HOMBRE = 'HOMBRE',
  MUJER = 'MUJER',
  UNISEX = 'UNISEX',
}

export enum TimeOfDay {
  DIA = 'DIA',
  NOCHE = 'NOCHE',
}

export enum Concentration {
  EAU_DE_PARFUM = 'EAU_DE_PARFUM',
  EAU_DE_TOILETTE = 'EAU_DE_TOILETTE',
  EAU_DE_TOILETTE_INTENSE = 'EAU_DE_TOILETTE_INTENSE',
  EAU_DE_COLOGNE = 'EAU_DE_COLOGNE',
  BODY_MIST = 'BODY_MIST',
  ELIXIR = 'ELIXIR',
  PARFUM = 'PARFUM',
  EXTRAIT_DE_PARFUM = 'EXTRAIT_DE_PARFUM',
}

export enum Projection {
  DISCRETA = 'DISCRETA',
  MODERADA = 'MODERADA',
  ALTA = 'ALTA',
}

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

  @Column({ default: false })
  bajoPedido: boolean;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ type: 'enum', enum: TimeOfDay, nullable: true })
  timeOfDay: TimeOfDay;

  @Column({ type: 'enum', enum: Concentration, nullable: true })
  concentration: Concentration;

  @Column({ type: 'enum', enum: Projection, nullable: true })
  projection: Projection;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discount: number;

  @Column({ default: 0 })
  salesCount: number;

  @Column({ type: 'text', nullable: true })
  detailDescription: string;

  @Column({ type: 'text', nullable: true })
  benefits: string;

  // ── PDP editorial (perfil olfativo / identidad / firma) ──
  // Título del perfil olfativo (ej. "La pirámide de Layton").
  @Column({ type: 'varchar', nullable: true })
  scentProfileTitle: string;

  // 3 secciones: cada una { title, notes:[{name,color}], description }.
  @Column({ type: 'json', nullable: true })
  scentSections: Array<{
    title: string;
    notes: Array<{ name: string; color: string }>;
    description: string;
  }>;

  // Carácter / Ocasión (valores seleccionados de listas predefinidas).
  @Column({ type: 'json', nullable: true })
  mood: string[];

  @Column({ type: 'json', nullable: true })
  occasion: string[];

  // Longevidad / Proyección como barra 0–10 (independiente del enum projection).
  @Column({ type: 'int', nullable: true })
  longevity: number;

  @Column({ type: 'int', nullable: true })
  projectionScore: number;

  // La firma: título + descripción + imagen.
  @Column({ type: 'varchar', nullable: true })
  signatureTitle: string;

  @Column({ type: 'text', nullable: true })
  signatureDescription: string;

  @Column({ type: 'varchar', nullable: true })
  signatureImageUrl: string;

  // Total ml per bottle (e.g., 100ml)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalMl: number;

  // Remaining ml from the currently opened bottle for decanting
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  openBottleMlRemaining: number;

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

  // Product variations (decant sizes, full bottle, etc.)
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
