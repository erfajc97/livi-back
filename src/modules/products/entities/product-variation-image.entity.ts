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
import { ProductVariation } from './product-variation.entity';

@Entity('product_variation_images')
@Index(['variationId'])
export class ProductVariationImage {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => ProductVariation, (variation) => variation.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variationId' })
  variation: ProductVariation;

  @Column({ type: 'bigint' })
  variationId: number;

  @Column()
  url: string; // S3 URL

  @Column()
  key: string; // S3 object key

  @Column({ nullable: true })
  alt: string; // Alt text for accessibility

  @Column({ default: 0 })
  displayOrder: number; // Order for displaying images

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
