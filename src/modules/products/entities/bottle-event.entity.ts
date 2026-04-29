import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

export enum BottleEventType {
  BOTTLE_OPENED = 'BOTTLE_OPENED',
  STOCK_ADJUSTED = 'STOCK_ADJUSTED',
  ML_ADJUSTED = 'ML_ADJUSTED',
}

@Entity('bottle_events')
export class BottleEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'enum', enum: BottleEventType })
  eventType: BottleEventType;

  @Column({ type: 'int', default: 0 })
  sealedBottlesBefore: number;

  @Column({ type: 'int', default: 0 })
  sealedBottlesAfter: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  openMlBefore: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  openMlAfter: number;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt: Date;
}
