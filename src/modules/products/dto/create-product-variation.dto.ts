import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsString,
  IsArray,
  Min,
} from 'class-validator';

export class CreateProductVariationDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number; // Overrides base product price if set

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  name?: string; // e.g., "XL - Green"

  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  optionValueIds: number[]; // Array of ProductOptionValue IDs

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
