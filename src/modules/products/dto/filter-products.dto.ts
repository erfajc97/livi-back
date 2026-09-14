import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterProductsDto extends PaginationDto {
  @ApiPropertyOptional({ example: 1, description: 'Filter by category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filter by marca ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  marcaId?: number;

  @ApiPropertyOptional({ example: 'Noé', description: 'Search in product name' })
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

  @ApiPropertyOptional({ example: true, description: 'Filter by active status ("true"/"false", default: true)' })
  @IsOptional()
  // String a propósito: con enableImplicitConversion, un boolean DTO
  // convertiría el query param 'false' en true. Se parsea en el service.
  isActive?: string;

  @ApiPropertyOptional({ example: true, description: 'Filter products with discount' })
  @IsOptional()
  hasDiscount?: string;

  @ApiPropertyOptional({ example: 'name', description: 'Sort by field (name, price, createdAt)', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'DESC', description: 'Sort order (ASC or DESC)', default: 'DESC' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
