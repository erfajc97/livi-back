import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsString,
  IsArray,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductVariationDto {
  @ApiProperty({ description: 'Product ID this variation belongs to' })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiPropertyOptional({ example: 129.0, description: 'Override price for this variation', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 70.0, description: 'Override unit acquisition cost for this variation', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @ApiPropertyOptional({ description: 'SKU code' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ example: 'Negro', description: 'Variation display name (color, tamaño…)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '#12100E', description: 'Color del swatch en hexadecimal (picker del admin)' })
  @IsString()
  @IsOptional()
  colorHex?: string;

  @ApiPropertyOptional({ example: 'Midi', description: 'Talla de la variante (una variante = color + talla)' })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiPropertyOptional({ description: 'Array of ProductOptionValue IDs' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  optionValueIds?: number[];

  @ApiPropertyOptional({ description: 'Whether this variation is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
