import {
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsIn,
  ArrayMinSize,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOrderItemDto } from './create-order-item.dto';

/**
 * Métodos de entrega válidos. Los SERVIENTREGA_* generan guía: la orden queda
 * pagada y espera despacho. Los otros se entregan en el acto.
 */
export const MANUAL_SALE_DELIVERY_METHODS = [
  'ENTREGA_PERSONAL',
  'RETIRO_PIWU',
  'SERVIENTREGA_GYE',
  'SERVIENTREGA_NACIONAL',
] as const;

export type ManualSaleDeliveryMethod =
  (typeof MANUAL_SALE_DELIVERY_METHODS)[number];

/**
 * Datos del comprador cuando la venta no es de un cliente ya registrado.
 * En el canal "redes" el admin no tiene ficha del cliente: la crea aquí.
 */
export class ManualSaleCustomerDto {
  @ApiProperty({ example: 'María' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del cliente es obligatorio' })
  firstName: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: 'maria@gmail.com' })
  @IsEmail({}, { message: 'El correo del cliente no es válido' })
  email: string;

  @ApiPropertyOptional({ example: '0999707768' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsString()
  @IsOptional()
  cedula?: string;

  @ApiPropertyOptional({ example: 'Guayaquil' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Guayas' })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiPropertyOptional({ example: 'Urdesa Central, calle 3ra #123' })
  @IsString()
  @IsOptional()
  address?: string;
}

export class CreateManualOrderDto {
  @ApiPropertyOptional({
    description:
      'ID de un cliente ya registrado. Se omite cuando se envía `customer`.',
  })
  @ValidateIf((dto: CreateManualOrderDto) => !dto.customer)
  @IsNumber({}, { message: 'Indica un cliente existente o los datos del cliente nuevo' })
  @IsPositive()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional({
    type: ManualSaleCustomerDto,
    description:
      'Datos del cliente nuevo (canal redes). Si el correo ya existe se reutiliza esa cuenta.',
  })
  @ValidateIf((dto: CreateManualOrderDto) => !dto.userId)
  @ValidateNested()
  @Type(() => ManualSaleCustomerDto)
  @IsOptional()
  customer?: ManualSaleCustomerDto;

  @ApiProperty({ type: [CreateOrderItemDto], description: 'Order items' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Order must have at least one item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({ example: 'EFECTIVO', description: 'Payment method' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({
    enum: MANUAL_SALE_DELIVERY_METHODS,
    description:
      'Forma de entrega. SERVIENTREGA_* deja la orden en "Pagado" a la espera de la guía; el resto se marca entregada.',
  })
  @IsIn(MANUAL_SALE_DELIVERY_METHODS as unknown as string[])
  @IsOptional()
  deliveryMethod?: ManualSaleDeliveryMethod;

  @ApiPropertyOptional({ description: 'Discount amount in dollars' })
  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Notes for the order' })
  @IsString()
  @IsOptional()
  notes?: string;
}
