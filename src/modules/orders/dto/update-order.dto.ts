import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../../../common/constants/order-status.enum';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiPropertyOptional({ 
    example: OrderStatus.ACCEPTED, 
    description: 'Order status',
    enum: OrderStatus 
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({ example: 'Credit Card', description: 'Payment method' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'paid', description: 'Payment status' })
  @IsString()
  @IsOptional()
  paymentStatus?: string;

  @ApiPropertyOptional({ example: 'PAY-123456', description: 'Payment reference' })
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiPropertyOptional({ example: 'Please handle with care', description: 'Order notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}