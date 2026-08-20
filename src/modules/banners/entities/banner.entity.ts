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

export enum BannerType {
  HERO = 'hero',
  CATEGORY = 'category',
  BRAND = 'brand',
  NAVBAR = 'navbar',
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

  // Arte vertical opcional para móvil: si está vacío, el front usa la de
  // escritorio.
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
