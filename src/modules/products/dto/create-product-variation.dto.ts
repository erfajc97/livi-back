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

  @ApiProperty({ example: 5, description: 'Decant size in ml (e.g., 3, 5, 10) or full bottle ml', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  mlSize: number;

  @ApiPropertyOptional({ example: false, description: 'Whether this variation is a full sealed bottle', default: false })
  @IsBoolean()
  @IsOptional()
  isFullBottle?: boolean;

  @ApiPropertyOptional({ example: 15.0, description: 'Override price for this variation', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'SKU code' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ example: '5ml Decant', description: 'Variation display name' })
  @IsString()
  @IsOptional()
  name?: string;

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
