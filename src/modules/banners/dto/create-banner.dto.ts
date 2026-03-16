import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBannerDto {
  @ApiProperty({ example: 'Promo Verano', description: 'Banner title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Hasta 50% de descuento', description: 'Banner subtitle' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiPropertyOptional({ description: 'Banner image URL' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: '/catalogo', description: 'Link or action URL' })
  @IsString()
  @IsOptional()
  link?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the banner is visible' })
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @ApiPropertyOptional({ example: 0, description: 'Display order position' })
  @IsNumber()
  @IsOptional()
  position?: number;
}
