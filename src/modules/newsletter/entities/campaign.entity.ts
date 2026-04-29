import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum CampaignStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  heading: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ nullable: true })
  ctaText: string;

  @Column({ nullable: true })
  ctaUrl: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus;

  @Column({ default: 0 })
  recipientCount: number;

  @Column({ nullable: true })
  sentAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
