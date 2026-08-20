import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BannerType } from '../entities/banner.entity';

export class CreateBannerDto {
  // El texto del banner es opcional: hay artes que ya traen el título quemado
  // en la imagen y no deben mostrar texto encima.
  @ApiPropertyOptional({ example: 'Promo Verano', description: 'Banner title (optional)' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Hasta 50% de descuento', description: 'Banner subtitle' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiPropertyOptional({ description: 'Banner image URL' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'S3 image key for deletion' })
  @IsString()
  @IsOptional()
  imageKey?: string;

  @ApiPropertyOptional({ description: 'Mobile banner image URL (arte vertical)' })
  @IsString()
  @IsOptional()
  mobileImageUrl?: string;

  @ApiPropertyOptional({ description: 'S3 key of the mobile image, for deletion' })
  @IsString()
  @IsOptional()
  mobileImageKey?: string;

  @ApiPropertyOptional({ example: '/catalogo', description: 'Link or action URL' })
  @IsString()
  @IsOptional()
  link?: string;

  @ApiPropertyOptional({ example: 'Ver Catálogo', description: 'CTA button text' })
  @IsString()
  @IsOptional()
  buttonText?: string;

  @ApiPropertyOptional({ enum: BannerType, example: BannerType.HERO, description: 'Banner type: hero, category, or marca (brand)' })
  @IsEnum(BannerType)
  @IsOptional()
  type?: BannerType;

  @ApiPropertyOptional({ example: true, description: 'Whether the banner is visible' })
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @ApiPropertyOptional({ example: 0, description: 'Display order position' })
  @IsNumber()
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({ example: 1, description: 'Category ID (for category/marca banners)' })
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Marca ID (for marca banners)' })
  @IsNumber()
  @IsOptional()
  marcaId?: number;
}
