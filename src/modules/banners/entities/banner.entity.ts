import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Marca } from '../../categories/entities/marca.entity';

/**
 * Un banner puede llevar una imagen o un video (portada de la home).
 * Se guarda como texto (no enum de Postgres) para que `DB_SYNCHRONIZE`
 * cree la columna sin crear un tipo nuevo ni necesitar ALTER TYPE.
 */
export type BannerMediaType = 'image' | 'video';

export enum BannerType {
  HERO = 'hero',
  CATEGORY = 'category',
  BRAND = 'brand',
  NAVBAR = 'navbar',
  CATALOG_PERFUMES = 'catalog_perfumes',
  CATALOG_BAJO_PEDIDO = 'catalog_bajo_pedido',
}

@Entity('banners')
@Index(['type', 'position'])
export class Banner {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  imageKey: string;

  /**
   * Qué hay en `imageUrl`: una imagen o un video. Lo rellena el backend al
   * subir, según el mimetype; en los banners antiguos queda 'image'.
   */
  @Column({ type: 'varchar', length: 16, default: 'image' })
  mediaType: BannerMediaType;

  // Arte vertical opcional para móvil: si está vacío, el front usa la de
  // escritorio. Cuando `imageUrl` es un video, esta imagen se usa como
  // `poster`.
  @Column({ nullable: true })
  mobileImageUrl: string;

  @Column({ nullable: true })
  mobileImageKey: string;

  @Column({ nullable: true })
  link: string;

  @Column({ nullable: true })
  buttonText: string;

  @Column({ type: 'enum', enum: BannerType, default: BannerType.HERO })
  type: BannerType;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ default: 0 })
  position: number;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'bigint', nullable: true })
  categoryId: number;

  @ManyToOne(() => Marca, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subcategoryId' })
  marca: Marca;

  @Column({ name: 'subcategoryId', type: 'bigint', nullable: true })
  marcaId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
