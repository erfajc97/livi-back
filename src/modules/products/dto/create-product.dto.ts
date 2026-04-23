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
import { Gender, TimeOfDay, Concentration, Projection } from '../entities/product.entity';

export class CreateProductDto {
  @ApiProperty({ example: 'Paco Rabanne', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 120.0, description: 'Product price (full bottle)', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 100, description: 'Total ml per bottle', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  totalMl: number;

  @ApiPropertyOptional({ example: 'Iconic fragrance with fresh and woody notes', description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/product.jpg', description: 'Product image URL' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 50, description: 'Sealed bottles in stock', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiProperty({ example: 1, description: 'Category ID' })
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @ApiProperty({ example: 1, description: 'Marca ID' })
  @IsNumber()
  @IsNotEmpty()
  marcaId: number;

  @ApiPropertyOptional({ example: true, description: 'Product active status', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Available for pre-order (bajo pedido)', default: false })
  @IsBoolean()
  @IsOptional()
  bajoPedido?: boolean;

  @ApiPropertyOptional({ enum: Gender, example: Gender.HOMBRE, description: 'Target gender' })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ enum: TimeOfDay, example: TimeOfDay.DIA, description: 'Recommended time of day' })
  @IsEnum(TimeOfDay)
  @IsOptional()
  timeOfDay?: TimeOfDay;

  @ApiPropertyOptional({ enum: Concentration, example: Concentration.EAU_DE_PARFUM, description: 'Fragrance concentration' })
  @IsEnum(Concentration)
  @IsOptional()
  concentration?: Concentration;

  @ApiPropertyOptional({ enum: Projection, example: Projection.MODERADA, description: 'Fragrance projection' })
  @IsEnum(Projection)
  @IsOptional()
  projection?: Projection;

  @ApiPropertyOptional({ example: 15.5, description: 'Discount percentage (0-100)', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ example: 'A rich and complex fragrance...', description: 'Long detailed description (markdown-like)' })
  @IsString()
  @IsOptional()
  detailDescription?: string;

  @ApiPropertyOptional({ example: '["Long lasting","Versatile"]', description: 'Benefits stored as JSON array of strings' })
  @IsString()
  @IsOptional()
  benefits?: string;
}
