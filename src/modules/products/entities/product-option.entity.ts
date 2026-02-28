import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductOptionValue } from './product-option-value.entity';
import { ProductType } from './product.entity';

@Entity('product_options')
export class ProductOption {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  name: string; // e.g., "Size", "Color", "Material"

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  productType: ProductType | null; // null means available for all types

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => ProductOptionValue, (value) => value.option)
  values: ProductOptionValue[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
