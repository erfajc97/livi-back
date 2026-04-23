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
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ComboProductDto {
  @ApiProperty({ description: 'Product ID to include in combo' })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ description: 'Specific product variation ID (e.g., a decant size)', required: false })
  @IsNumber()
  @IsOptional()
  productVariationId?: number;

  @ApiProperty({ description: 'Quantity of this product in the combo', default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;
}

export class CreateComboDto {
  @ApiProperty({ description: 'Combo name', example: 'Pack Aventurero' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Combo description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Combo image URL', required: false })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ description: 'Final price for the combo (discounted)', example: 75.0 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  finalPrice: number;

  @ApiProperty({ description: 'Discount amount for the combo', example: 25.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiProperty({ description: 'Whether the combo is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Products in this combo', type: [ComboProductDto] })
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComboProductDto)
  products: ComboProductDto[];
}
