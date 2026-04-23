import { IsString, IsOptional } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  value: string;

  @IsString()
  @IsOptional()
  description?: string;
}
