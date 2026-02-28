import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../../../common/constants/order-status.enum';
import { OrderItemResponseDto } from './order-item-response.dto';

export class OrderResponseDto {
  @ApiProperty({ example: 1, description: 'Order ID' })
  id: number;

  @ApiProperty({ example: 'ORD-2024-001234', description: 'Unique order number' })
  orderNumber: string;

  @ApiProperty({ example: 1, description: 'User ID who placed the order' })
  userId: number;

  @ApiProperty({ type: [OrderItemResponseDto], description: 'Order items' })
  items: OrderItemResponseDto[];

  @ApiProperty({ example: OrderStatus.CREATED, description: 'Order status', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ example: 360.0, description: 'Total order amount' })
  total: number;

  @ApiPropertyOptional({ example: 'Credit Card', description: 'Payment method' })
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'paid', description: 'Payment status' })
  paymentStatus?: string;

  @ApiPropertyOptional({ example: 'PAY-123456', description: 'Payment reference' })
  paymentReference?: string;

  @ApiPropertyOptional({ example: '123 Main St', description: 'Shipping address' })
  shippingAddress?: string;

  @ApiPropertyOptional({ example: 'New York', description: 'Shipping city' })
  shippingCity?: string;

  @ApiPropertyOptional({ example: '10001', description: 'Shipping postal code' })
  shippingPostalCode?: string;

  @ApiPropertyOptional({ example: 'USA', description: 'Shipping country' })
  shippingCountry?: string;

  @ApiPropertyOptional({ example: 'Please handle with care', description: 'Order notes' })
  notes?: string;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z', description: 'Order received date' })
  receivedAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z', description: 'Order accepted date' })
  acceptedAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z', description: 'Order rejected date' })
  rejectedAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z', description: 'Order shipped date' })
  shippedAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z', description: 'Order delivered date' })
  deliveredAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z', description: 'Order cancelled date' })
  cancelledAt?: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;

  constructor(order: any) {
    this.id = order.id;
    this.orderNumber = order.orderNumber;
    this.userId = order.userId;
    this.items = order.items ? order.items.map((item: any) => new OrderItemResponseDto(item)) : [];
    this.status = order.status;
    this.total = order.total;
    this.paymentMethod = order.paymentMethod;
    this.paymentStatus = order.paymentStatus;
    this.paymentReference = order.paymentReference;
    this.shippingAddress = order.shippingAddress;
    this.shippingCity = order.shippingCity;
    this.shippingPostalCode = order.shippingPostalCode;
    this.shippingCountry = order.shippingCountry;
    this.notes = order.notes;
    this.receivedAt = order.receivedAt;
    this.acceptedAt = order.acceptedAt;
    this.rejectedAt = order.rejectedAt;
    this.shippedAt = order.shippedAt;
    this.deliveredAt = order.deliveredAt;
    this.cancelledAt = order.cancelledAt;
    this.createdAt = order.createdAt;
    this.updatedAt = order.updatedAt;
  }
}