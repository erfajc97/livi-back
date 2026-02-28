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
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from '../../../common/constants/order-status.enum';

@Entity('orders')
@Index(['userId'])
@Index(['status'])
@Index(['orderNumber'])
export class Order {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  // Unique order number (e.g., ORD-2024-001234)
  @Column({ unique: true })
  orderNumber: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'bigint' })
  userId: number;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  // Order status
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.CREATED,
  })
  status: OrderStatus;

  // Total amount (sum of all items subtotals)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  // Payment information (manual for now, will be payment provider later)
  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  paymentStatus: string;

  @Column({ nullable: true })
  paymentReference: string;

  // Shipping information
  @Column({ nullable: true })
  shippingAddress: string;

  @Column({ nullable: true })
  shippingCity: string;

  @Column({ nullable: true })
  shippingPostalCode: string;

  @Column({ nullable: true })
  shippingCountry: string;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  // Status change timestamps
  @Column({ nullable: true })
  receivedAt: Date;

  @Column({ nullable: true })
  acceptedAt: Date;

  @Column({ nullable: true })
  rejectedAt: Date;

  @Column({ nullable: true })
  shippedAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}