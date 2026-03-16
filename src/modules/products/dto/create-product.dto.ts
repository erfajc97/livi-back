import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType, MeasureUnit } from '../entities/product.entity';

export class CreateProductDto {
  @ApiProperty({ example: 'Paco Rabanne', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Paco Rabanne', description: 'Product brand' })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ example: 120.0, description: 'Product price', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiProperty({ enum: ProductType, example: ProductType.PERFUME, description: 'Product type' })
  @IsEnum(ProductType)
  @IsNotEmpty()
  type: ProductType;

  @ApiPropertyOptional({ example: 'Iconic fragrance with fresh and woody notes', description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/product.jpg', description: 'Product image URL' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 50, description: 'Product stock quantity', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ example: 100, description: 'Measurement value (e.g., volume in ml)', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  measureValue?: number;

  @ApiPropertyOptional({ enum: MeasureUnit, example: MeasureUnit.ML, description: 'Measurement unit' })
  @IsEnum(MeasureUnit)
  @IsOptional()
  measureUnit?: MeasureUnit;

  @ApiProperty({ example: 1, description: 'Category ID' })
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @ApiProperty({ example: 1, description: 'Subcategory ID' })
  @IsNumber()
  @IsNotEmpty()
  subcategoryId: number;

  @ApiPropertyOptional({ example: 1, description: 'Parent product ID (for decants)' })
  @IsNumber()
  @IsOptional()
  parentProductId?: number; // For decants

  @ApiPropertyOptional({ example: true, description: 'Product active status', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
