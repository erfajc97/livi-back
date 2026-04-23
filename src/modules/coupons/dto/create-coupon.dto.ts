import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsArray,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType, CouponScope } from '../entities/coupon.entity';

export class CreateCouponDto {
  @ApiProperty({ example: 'VERANO2026', description: 'Unique coupon code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: 'Descuento de verano' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: CouponType, example: CouponType.PERCENTAGE })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({ example: 15, description: 'Discount value ($ amount or % depending on type)' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ enum: CouponScope, example: CouponScope.ALL_PRODUCTS })
  @IsEnum(CouponScope)
  @IsOptional()
  scope?: CouponScope;

  @ApiPropertyOptional({ example: 100, description: 'Max total uses (null = unlimited)' })
  @IsNumber()
  @IsOptional()
  maxUses?: number;

  @ApiPropertyOptional({ example: true, description: 'One use per customer' })
  @IsBoolean()
  @IsOptional()
  singleUsePerCustomer?: boolean;

  @ApiPropertyOptional({ example: 20, description: 'Minimum order amount to apply coupon' })
  @IsNumber()
  @IsOptional()
  minOrderAmount?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z', description: 'Expiration date' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ example: [1, 2, 3], description: 'Product IDs (when scope = specific_products)' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  productIds?: number[];

  @ApiPropertyOptional({ example: [1], description: 'Category IDs (when scope = specific_categories)' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  categoryIds?: number[];
}
