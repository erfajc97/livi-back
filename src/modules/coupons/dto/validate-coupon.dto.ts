import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({ example: 'VERANO2026', description: 'Coupon code to validate' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 50.00, description: 'Cart subtotal for validation' })
  @IsNumber()
  orderAmount: number;

  @ApiPropertyOptional({ example: [1, 2], description: 'Product IDs in the cart' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  productIds?: number[];

  @ApiPropertyOptional({ example: [1], description: 'Category IDs of products in cart' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  categoryIds?: number[];
}
