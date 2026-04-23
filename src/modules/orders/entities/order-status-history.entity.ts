import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'bigint' })
  orderId: number;

  @Column()
  fromStatus: string;

  @Column()
  toStatus: string;

  // Who made the change (admin name or 'system')
  @Column({ nullable: true })
  changedBy: string;

  // Optional note for this status change
  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}
