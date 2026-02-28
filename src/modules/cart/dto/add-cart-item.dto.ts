import { IsNumber, IsOptional, Min, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCartItemDto {
  @ApiPropertyOptional({ example: 1, description: 'Product ID (if adding base product to cart)' })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  productId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Product Variation ID (if adding a specific variation to cart)' })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  productVariationId?: number;

  @ApiProperty({ example: 2, description: 'Quantity to add to cart', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}