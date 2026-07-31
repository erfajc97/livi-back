import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsBoolean, IsOptional, IsArray, IsEnum, Min } from 'class-validator';
import { SectionPlacement } from '../entities/landing-section.entity';

export class CreateLandingSectionDto {
  @ApiProperty({ example: 'ÚLTIMOS INGRESOS' })
  @IsString()
  title: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({
    enum: SectionPlacement,
    example: SectionPlacement.HOME,
    required: false,
    description: 'Dónde se muestra: home (default) o cart (recomendados del carrito)',
  })
  @IsOptional()
  @IsEnum(SectionPlacement)
  placement?: SectionPlacement;

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
