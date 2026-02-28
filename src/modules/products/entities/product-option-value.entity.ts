import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductOption } from './product-option.entity';

@Entity('product_option_values')
export class ProductOptionValue {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  value: string; // e.g., "XL", "Green", "Cotton"

  @Column({ nullable: true })
  displayName: string; // e.g., "Extra Large", "Forest Green"

  @ManyToOne(() => ProductOption, (option) => option.values)
  @JoinColumn({ name: 'optionId' })
  option: ProductOption;

  @Column({ type: 'bigint' })
  optionId: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
