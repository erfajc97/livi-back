import { IsNumber, IsPositive, IsOptional, IsString, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateManualOrderDto {
  @ApiProperty({ description: 'Client user ID to create order for' })
  @IsNumber()
  @IsPositive()
  userId: number;

  @ApiProperty({ type: [CreateOrderItemDto], description: 'Order items' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Order must have at least one item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({ example: 'Efectivo', description: 'Payment method' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Discount amount in dollars' })
  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Notes for the order' })
  @IsString()
  @IsOptional()
  notes?: string;
}
