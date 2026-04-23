import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBlogPostDto {
  @ApiProperty({ example: 'Los mejores perfumes árabes 2026' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'los-mejores-perfumes-arabes-2026', description: 'URL-friendly slug. Auto-generated from title if not provided.' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'Descubre las fragancias árabes más populares del momento.' })
  @IsString()
  @IsOptional()
  excerpt?: string;

  @ApiProperty({ example: '<p>Contenido completo del artículo...</p>' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'S3 image key' })
  @IsString()
  @IsOptional()
  imageKey?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: 0, description: 'Display order priority (lower = first)' })
  @IsNumber()
  @IsOptional()
  position?: number;
}
