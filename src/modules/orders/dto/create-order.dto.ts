import { IsArray, ValidateNested, IsString, IsOptional, IsNotEmpty, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'List of items to order',
    example: [
      { productId: 1, quantity: 2 },
      { productVariationId: 1, quantity: 1 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Order must have at least one item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({ example: 'Credit Card', description: 'Payment method' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: '123 Main St', description: 'Shipping address' })
  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @ApiPropertyOptional({ example: 'New York', description: 'Shipping city' })
  @IsString()
  @IsOptional()
  shippingCity?: string;

  @ApiPropertyOptional({ example: '10001', description: 'Shipping postal code' })
  @IsString()
  @IsOptional()
  shippingPostalCode?: string;

  @ApiPropertyOptional({ example: 'USA', description: 'Shipping country' })
  @IsString()
  @IsOptional()
  shippingCountry?: string;

  @ApiPropertyOptional({ example: 'Please handle with care', description: 'Order notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}