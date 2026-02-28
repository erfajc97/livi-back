import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateProductOptionValueDto {
  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsNumber()
  @IsNotEmpty()
  optionId: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
