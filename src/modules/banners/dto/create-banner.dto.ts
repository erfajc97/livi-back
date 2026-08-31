import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BannerType } from '../entities/banner.entity';

const toBool = ({ value }: { value: unknown }) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return value;
};

const toOptNumber = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

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

  @ApiPropertyOptional({ enum: BannerType, example: BannerType.HERO, description: 'Banner type: hero, category, brand, navbar, catalog_perfumes, catalog_bajo_pedido' })
  @IsEnum(BannerType)
  @IsOptional()
  type?: BannerType;

  @ApiPropertyOptional({ example: true, description: 'Whether the banner is visible' })
  @Transform(toBool)
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @ApiPropertyOptional({ example: 0, description: 'Display order position' })
  @Transform(toOptNumber)
  @IsNumber()
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({ example: 1, description: 'Category ID (for category/marca banners)' })
  @Transform(toOptNumber)
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Marca ID (for marca banners)' })
  @Transform(toOptNumber)
  @IsNumber()
  @IsOptional()
  marcaId?: number;
}
