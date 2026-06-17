import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, TimeOfDay, Concentration, Projection } from '../entities/product.entity';

// ── Perfil olfativo (secciones anidadas) ──
class ScentNoteDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Color hex (ej. #E8D8C0)' })
  @IsString()
  color: string;
}

class ScentSectionDto {
  @ApiProperty({ example: 'Notas de salida' })
  @IsString()
  title: string;

  @ApiProperty({ type: [ScentNoteDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScentNoteDto)
  notes: ScentNoteDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Paco Rabanne', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 120.0, description: 'Product price (full bottle)', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiPropertyOptional({ example: 70.0, description: 'Unit acquisition cost (for COGS reporting)', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @ApiProperty({ example: 100, description: 'Total ml per bottle', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  totalMl: number;

  @ApiPropertyOptional({ example: 'Iconic fragrance with fresh and woody notes', description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/product.jpg', description: 'Product image URL' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 50, description: 'Sealed bottles in stock', minimum: 0 })
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

  @ApiPropertyOptional({ example: false, description: 'Available for pre-order (bajo pedido)', default: false })
  @IsBoolean()
  @IsOptional()
  bajoPedido?: boolean;

  @ApiPropertyOptional({ enum: Gender, example: Gender.HOMBRE, description: 'Target gender' })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ enum: TimeOfDay, example: TimeOfDay.DIA, description: 'Recommended time of day' })
  @IsEnum(TimeOfDay)
  @IsOptional()
  timeOfDay?: TimeOfDay;

  @ApiPropertyOptional({ enum: Concentration, example: Concentration.EAU_DE_PARFUM, description: 'Fragrance concentration' })
  @IsEnum(Concentration)
  @IsOptional()
  concentration?: Concentration;

  @ApiPropertyOptional({ enum: Projection, example: Projection.MODERADA, description: 'Fragrance projection' })
  @IsEnum(Projection)
  @IsOptional()
  projection?: Projection;

  @ApiPropertyOptional({ example: 15.5, description: 'Discount percentage (0-100)', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ example: 'A rich and complex fragrance...', description: 'Long detailed description (markdown-like)' })
  @IsString()
  @IsOptional()
  detailDescription?: string;

  @ApiPropertyOptional({ example: '["Long lasting","Versatile"]', description: 'Benefits stored as JSON array of strings' })
  @IsString()
  @IsOptional()
  benefits?: string;

  // ── PDP editorial ──
  @ApiPropertyOptional({ description: 'Título del perfil olfativo (ej. "La pirámide de Layton")' })
  @IsString()
  @IsOptional()
  scentProfileTitle?: string;

  @ApiPropertyOptional({ type: [ScentSectionDto], description: '3 secciones del perfil olfativo' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScentSectionDto)
  @IsOptional()
  scentSections?: ScentSectionDto[];

  @ApiPropertyOptional({ description: 'Carácter (valores seleccionados)', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mood?: string[];

  @ApiPropertyOptional({ description: 'Ocasión (valores seleccionados)', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  occasion?: string[];

  @ApiPropertyOptional({ example: 8, description: 'Longevidad 0–10' })
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  longevity?: number;

  @ApiPropertyOptional({ example: 7, description: 'Proyección 0–10 (barra PDP)' })
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  projectionScore?: number;

  @ApiPropertyOptional({ description: 'Título de la sección "La firma"' })
  @IsString()
  @IsOptional()
  signatureTitle?: string;

  @ApiPropertyOptional({ description: 'Descripción de la firma' })
  @IsString()
  @IsOptional()
  signatureDescription?: string;

  @ApiPropertyOptional({ description: 'URL de la imagen de la firma' })
  @IsString()
  @IsOptional()
  signatureImageUrl?: string;
}
