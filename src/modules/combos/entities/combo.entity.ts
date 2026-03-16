import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ComboProduct } from './combo-product.entity';

@Entity('combos')
export class Combo {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  finalPrice: number;

  @Column({ nullable: true })
  sizeLabel: string; // e.g. "5ml C/U", "10ml C/U"

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => ComboProduct, (cp) => cp.combo, { cascade: true, eager: true })
  comboProducts: ComboProduct[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
