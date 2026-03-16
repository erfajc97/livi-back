import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ProductType } from '../entities/product.entity';

export class CreateProductOptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ProductType)
  @IsOptional()
  productType?: ProductType | null;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
