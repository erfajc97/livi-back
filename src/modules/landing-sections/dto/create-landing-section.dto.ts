import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsBoolean, IsOptional, IsArray, Min } from 'class-validator';

export class CreateLandingSectionDto {
  @ApiProperty({ example: 'ÚLTIMOS INGRESOS' })
  @IsString()
  title: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: [1, 2, 3], description: 'Array of product IDs', required: false })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  productIds?: number[];
}
