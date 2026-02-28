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
import { Product } from './product.entity';

@Entity('product_videos')
@Index(['productId'])
export class ProductVideo {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Product, (product) => product.videos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'bigint' })
  productId: number;

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
