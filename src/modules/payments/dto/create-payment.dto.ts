import { IsNumber, IsString, IsOptional, IsArray, ValidateNested, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PaymentOrderItemDto {
  @ApiPropertyOptional({ description: 'Product variation ID (for decants)' })
  @IsNumber()
  @IsOptional()
  productVariationId?: number;

  @ApiPropertyOptional({ description: 'Product ID (for full bottle purchase without variation)' })
  @IsNumber()
  @IsOptional()
  productId?: number;

  @ApiProperty({ description: 'Quantity', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Override price (for combo items)' })
  @IsNumber()
  @IsOptional()
  priceOverride?: number;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order items', type: [PaymentOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentOrderItemDto)
  items: PaymentOrderItemDto[];

  @ApiProperty({ description: 'Payment method', enum: ['PAYPHONE', 'TRANSFERENCIA'] })
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Customer name' })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Customer email' })
  @IsString()
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Customer phone' })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiPropertyOptional({ description: 'Shipping city' })
  @IsString()
  @IsOptional()
  shippingCity?: string;

  @ApiPropertyOptional({ description: 'Shipping address' })
  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @ApiPropertyOptional({ description: 'Delivery method' })
  @IsString()
  @IsOptional()
  deliveryMethod?: string;

  @ApiPropertyOptional({ description: 'Delivery cost in dollars' })
  @IsNumber()
  @IsOptional()
  deliveryCost?: number;

  @ApiPropertyOptional({ description: 'Coupon code' })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiPropertyOptional({ description: 'Coupon discount amount in dollars' })
  @IsNumber()
  @IsOptional()
  couponDiscount?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
