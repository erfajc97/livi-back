import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('subscribers')
export class Subscriber {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  unsubscribeToken: string;

  @CreateDateColumn()
  subscribedAt: Date;
}
