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

@Entity('product_variation_videos')
@Index(['variationId'])
export class ProductVariationVideo {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => ProductVariation, (variation) => variation.videos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variationId' })
  variation: ProductVariation;

  @Column({ type: 'bigint' })
  variationId: number;

  @Column()
  url: string; // S3 URL

  @Column()
  key: string; // S3 object key

  @Column({ nullable: true })
  title: string; // Video title

  @Column({ nullable: true })
  description: string; // Video description

  @Column({ default: 0 })
  displayOrder: number; // Order for displaying videos

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
