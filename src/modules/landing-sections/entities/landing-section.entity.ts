import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

/** Dónde se pinta la sección: home o el bloque de recomendados del carrito. */
export enum SectionPlacement {
  HOME = 'home',
  CART = 'cart',
}

@Entity('landing_sections')
export class LandingSection {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  title: string;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'varchar', length: 20, default: SectionPlacement.HOME })
  placement: SectionPlacement;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Product)
  @JoinTable({
    name: 'landing_section_products',
    joinColumn: { name: 'landingSectionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'productId', referencedColumnName: 'id' },
  })
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
