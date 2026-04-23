import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, TimeOfDay, Concentration, Projection } from '../entities/product.entity';
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

  @ApiPropertyOptional({ example: false, description: 'Filter by bajo pedido status' })
  @IsOptional()
  bajoPedido?: string;

  @ApiPropertyOptional({ enum: Gender, description: 'Filter by gender' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ enum: TimeOfDay, description: 'Filter by time of day' })
  @IsOptional()
  @IsEnum(TimeOfDay)
  timeOfDay?: TimeOfDay;

  @ApiPropertyOptional({ enum: Concentration, description: 'Filter by concentration' })
  @IsOptional()
  @IsEnum(Concentration)
  concentration?: Concentration;

  @ApiPropertyOptional({ enum: Projection, description: 'Filter by projection' })
  @IsOptional()
  @IsEnum(Projection)
  projection?: Projection;

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
