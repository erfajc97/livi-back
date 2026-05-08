import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TransactionType = 'income' | 'expense';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 10 })
  type: TransactionType;

  @Column()
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ default: 'Pagado' })
  status: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  accountName: string;

  // Source linkage for auto-generated transactions (e.g. order COGS, payphone fee, bill payment)
  // Used to compensate / delete on order cancellation.
  @Column({ type: 'varchar', length: 30, nullable: true })
  referenceType: string | null;

  @Column({ type: 'bigint', nullable: true })
  referenceId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
