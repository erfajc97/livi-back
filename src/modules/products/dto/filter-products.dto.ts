import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType, MeasureUnit } from '../entities/product.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterProductsDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'perfume', description: 'Filter by product type', enum: ProductType })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiPropertyOptional({ example: 1, description: 'Filter by category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filter by subcategory ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subcategoryId?: number;

  @ApiPropertyOptional({ example: 'Dior', description: 'Filter by brand name' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'Sauvage', description: 'Search in product name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 50, description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 200, description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: true, description: 'Filter by active status', default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'ml', description: 'Filter by measure unit', enum: MeasureUnit })
  @IsOptional()
  @IsEnum(MeasureUnit)
  measureUnit?: MeasureUnit;

  @ApiPropertyOptional({ example: 'name', description: 'Sort by field (name, price, brand, createdAt)', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'DESC', description: 'Sort order (ASC or DESC)', default: 'DESC' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}