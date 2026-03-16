import { IsNumber, IsOptional, Min, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({ example: 1, description: 'Product ID (if ordering base product)' })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  productId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Product Variation ID (if ordering a specific variation)' })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  productVariationId?: number;

  @ApiProperty({ example: 2, description: 'Quantity to order', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}