import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
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

  @Column({ nullable: true })
  imageKey: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  finalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ default: true })
  isActive: boolean;

  // Versiones: un combo "versión" apunta a su combo base. Comparten nombre,
  // pero traen otros productos y otro precio (p. ej. productos más caros).
  @Column({ type: 'bigint', nullable: true })
  parentComboId: number | null;

  @ManyToOne(() => Combo, (c) => c.versions, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentComboId' })
  parent: Combo;

  @OneToMany(() => Combo, (c) => c.parent)
  versions: Combo[];

  @OneToMany(() => ComboProduct, (cp) => cp.combo, { cascade: true, eager: true })
  comboProducts: ComboProduct[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
