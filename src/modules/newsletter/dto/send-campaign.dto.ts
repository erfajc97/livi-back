import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Nuevas fragancias de temporada' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Descubre las nuevas fragancias' })
  @IsString()
  heading: string;

  @ApiProperty({ example: 'Hemos preparado una selección exclusiva...' })
  @IsString()
  body: string;

  @ApiProperty({ required: false, example: 'Ver catálogo' })
  @IsOptional()
  @IsString()
  ctaText?: string;

  @ApiProperty({ required: false, example: 'https://livi.ec/catalogo' })
  @IsOptional()
  @IsString()
  ctaUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  ctaText?: string;

  @IsOptional()
  @IsString()
  ctaUrl?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
