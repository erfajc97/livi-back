import { IsString, IsNumber, IsOptional, IsPositive, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class BillItemDto {
  @ApiProperty({ example: 'Envases 100ml x50' })
  @IsString()
  description: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class CreateBillDto {
  @ApiProperty({ example: 'Compra insumos Febrero' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Compra de envases y etiquetas para producción' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Banco Pichincha' })
  @IsString()
  @IsOptional()
  bank?: string;

  @ApiPropertyOptional({ example: 'Transferencia' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({ example: '2026-02-24' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ example: 420.0 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ type: [BillItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  @IsOptional()
  items?: BillItemDto[];

  @ApiPropertyOptional({ example: 'pending' })
  @IsString()
  @IsOptional()
  status?: string;
}
