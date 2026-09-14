import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Variación (color, tamaño, etc.) para creación/importación ──
export class CreateProductVariantDto {
  @ApiProperty({ example: 'Negro', description: 'Nombre visible de la variación (color, tamaño…)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 129.0, description: 'Precio de esta variación', minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 70.0, description: 'Costo de adquisición de la variación', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @ApiPropertyOptional({ description: 'SKU de la variación' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ example: '#12100E', description: 'Color del swatch en hexadecimal (picker del admin)' })
  @IsString()
  @IsOptional()
  colorHex?: string;

  @ApiPropertyOptional({ example: 'Midi', description: 'Talla de la variante (una variante = color + talla)' })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Noé Leather Backpack', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 129.0, description: 'Product price', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiPropertyOptional({ example: 70.0, description: 'Unit acquisition cost (for COGS reporting)', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @ApiPropertyOptional({ example: 'Mochila pañalera premium de cuero…', description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/product.jpg', description: 'Product image URL' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 50, description: 'Units in stock', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiProperty({ example: 1, description: 'Category ID' })
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @ApiProperty({ example: 1, description: 'Marca ID' })
  @IsNumber()
  @IsNotEmpty()
  marcaId: number;

  @ApiPropertyOptional({ example: true, description: 'Product active status', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 15.5, description: 'Discount percentage (0-100)', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ example: 'Cuero vacuno genuino premium…', description: 'Long detailed description (markdown-like)' })
  @IsString()
  @IsOptional()
  detailDescription?: string;

  @ApiPropertyOptional({ example: '["Cuero genuino","Hecho a mano en Ecuador"]', description: 'Benefits stored as JSON array of strings' })
  @IsString()
  @IsOptional()
  benefits?: string;

  @ApiPropertyOptional({ example: '["Pañalera","Bolso de trabajo"]', description: 'Common uses stored as JSON array of strings (acordeón "Usos comunes")' })
  @IsString()
  @IsOptional()
  commonUses?: string;

  @ApiPropertyOptional({ example: '[3,5]', description: 'IDs de productos "Combina con" (Pairs With) como JSON array de números' })
  @IsString()
  @IsOptional()
  pairsWith?: string;

  @ApiPropertyOptional({ example: '["Mini","Midi","Full"]', description: 'Tallas disponibles como JSON array de strings (selector "Talla" de la ficha)' })
  @IsString()
  @IsOptional()
  sizes?: string;

  @ApiPropertyOptional({ example: '[{"url":"https://instagram.com/p/…","image":"https://…/post.jpg"}]', description: 'Posts de Instagram de la ficha como JSON array de { url, image }' })
  @IsString()
  @IsOptional()
  instagramPosts?: string;

  @ApiPropertyOptional({ type: [CreateProductVariantDto], description: 'Variaciones (colores, tamaños…) a crear junto al producto.' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  @IsOptional()
  variants?: CreateProductVariantDto[];
}
