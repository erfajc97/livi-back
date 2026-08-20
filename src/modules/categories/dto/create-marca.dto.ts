import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

const toBool = ({ value }: { value: unknown }) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return value;
};

export class CreateMarcaDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @Transform(toBool)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Transform(toBool)
  @IsBoolean()
  @IsOptional()
  bajoPedido?: boolean;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  imageKey?: string;

  @IsString()
  @IsOptional()
  mobileImageUrl?: string;

  @IsString()
  @IsOptional()
  mobileImageKey?: string;
}
