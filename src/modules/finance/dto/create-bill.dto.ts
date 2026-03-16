import { IsString, IsNumber, IsOptional, IsPositive, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBillDto {
  @ApiProperty({ example: 'TC Mastercard - Envases' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Banco Pichincha' })
  @IsString()
  @IsOptional()
  bank?: string;

  @ApiProperty({ example: '2026-02-24' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ example: 420.0 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: 'pending' })
  @IsString()
  @IsOptional()
  status?: string;
}
