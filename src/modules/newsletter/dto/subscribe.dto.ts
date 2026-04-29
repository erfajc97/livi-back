import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({ example: 'cliente@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ required: false, example: 'María' })
  @IsOptional()
  @IsString()
  firstName?: string;
}
