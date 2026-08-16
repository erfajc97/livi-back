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

  // Guest checkout: una orden puede no tener dueño (sin sesión).
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'bigint', nullable: true })
  userId: number | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  // Order status
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.CREATED,
  })
  status: OrderStatus;

  // Amounts
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  payphoneSurcharge: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  couponDiscount: number;

  // Total amount (subtotal + deliveryCost + surcharge - couponDiscount)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  // Customer info (for guest checkout)
  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  customerEmail: string;

  @Column({ nullable: true })
  customerPhone: string;

  // Cédula del comprador: la pide Servientrega para despachar y en la venta
  // manual es el único lugar donde queda registrada (el cliente llega por redes).
  @Column({ nullable: true })
  customerCedula: string;

  // Delivery
  @Column({ nullable: true })
  deliveryMethod: string;

  // Payment information
  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true, default: 'pending' })
  paymentStatus: string;

  @Column({ nullable: true })
  paymentReference: string;

  // Tracking (Servientrega guide number)
  @Column({ nullable: true })
  trackingCode: string;

  // Transfer receipt image
  @Column({ nullable: true })
  transferReceiptUrl: string;

  @Column({ nullable: true })
  transferReceiptKey: string;

  // PayPhone specific
  @Column({ nullable: true })
  payphonePaymentId: string;

  @Column({ nullable: true })
  clientTransactionId: string;

  // Shipping information
  @Column({ nullable: true })
  shippingAddress: string;

  @Column({ nullable: true })
  shippingCity: string;

  @Column({ nullable: true })
  shippingProvince: string;

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