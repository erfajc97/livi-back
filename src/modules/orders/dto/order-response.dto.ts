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

  @ApiPropertyOptional({ example: 'Juan Pérez', description: 'Client full name' })
  userName?: string;

  @ApiProperty({ type: [OrderItemResponseDto], description: 'Order items' })
  items: OrderItemResponseDto[];

  @ApiProperty({ example: OrderStatus.CREATED, description: 'Order status', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ description: 'Subtotal (items only)' })
  subtotal: number;

  @ApiProperty({ description: 'Delivery cost' })
  deliveryCost: number;

  @ApiProperty({ description: 'PayPhone surcharge (6%)' })
  payphoneSurcharge: number;

  @ApiProperty({ description: 'Coupon discount' })
  couponDiscount: number;

  @ApiProperty({ example: 360.0, description: 'Total order amount' })
  total: number;

  @ApiPropertyOptional({ description: 'Customer name' })
  customerName?: string;

  @ApiPropertyOptional({ description: 'Customer email' })
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Customer phone' })
  customerPhone?: string;

  @ApiPropertyOptional({ description: 'Cédula del comprador (despacho Servientrega)' })
  customerCedula?: string;

  @ApiPropertyOptional({ description: 'Delivery method' })
  deliveryMethod?: string;

  @ApiPropertyOptional({ description: 'Tracking code (Servientrega guide)' })
  trackingCode?: string;

  @ApiPropertyOptional({ description: 'Transfer receipt image URL' })
  transferReceiptUrl?: string;

  @ApiPropertyOptional({ example: 'PAYPHONE', description: 'Payment method' })
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'paid', description: 'Payment status' })
  paymentStatus?: string;

  @ApiPropertyOptional({ example: 'PAY-123456', description: 'Payment reference' })
  paymentReference?: string;

  @ApiPropertyOptional({ example: '123 Main St', description: 'Shipping address' })
  shippingAddress?: string;

  @ApiPropertyOptional({ example: 'New York', description: 'Shipping city' })
  shippingCity?: string;

  @ApiPropertyOptional({ example: 'Guayas', description: 'Shipping province' })
  shippingProvince?: string;

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
    this.userName = order.user
      ? `${order.user.firstName} ${order.user.lastName}`
      : undefined;
    this.items = order.items ? order.items.map((item: any) => new OrderItemResponseDto(item)) : [];
    this.status = order.status;
    this.subtotal = Number(order.subtotal || 0);
    this.deliveryCost = Number(order.deliveryCost || 0);
    this.payphoneSurcharge = Number(order.payphoneSurcharge || 0);
    this.couponDiscount = Number(order.couponDiscount || 0);
    this.total = Number(order.total || 0);
    this.customerName = order.customerName;
    this.customerEmail = order.customerEmail;
    this.customerPhone = order.customerPhone;
    this.customerCedula = order.customerCedula;
    this.deliveryMethod = order.deliveryMethod;
    this.trackingCode = order.trackingCode;
    this.transferReceiptUrl = order.transferReceiptUrl;
    this.paymentMethod = order.paymentMethod;
    this.paymentStatus = order.paymentStatus;
    this.paymentReference = order.paymentReference;
    this.shippingAddress = order.shippingAddress;
    this.shippingCity = order.shippingCity;
    this.shippingProvince = order.shippingProvince;
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