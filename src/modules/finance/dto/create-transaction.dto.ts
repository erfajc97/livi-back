import { IsString, IsNumber, IsOptional, IsIn, IsPositive, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ example: 'income', enum: ['income', 'expense'] })
  @IsString()
  @IsIn(['income', 'expense'])
  type: 'income' | 'expense';

  @ApiProperty({ example: 'Venta Online' })
  @IsString()
  category: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: '2026-02-20' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Efectivo' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'Pagado' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'Pago de cliente' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Notas adicionales' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'Banco Pichincha' })
  @IsString()
  @IsOptional()
  accountName?: string;
}
