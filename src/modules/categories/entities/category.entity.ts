import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Marca } from './marca.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  slug: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  imageKey: string;

  // Arte vertical opcional para móvil: si está vacío, el front usa la de
  // escritorio.
  @Column({ nullable: true })
  mobileImageUrl: string;

  @Column({ nullable: true })
  mobileImageKey: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  bajoPedido: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Marca, (marca) => marca.category)
  marcas: Marca[];
}
