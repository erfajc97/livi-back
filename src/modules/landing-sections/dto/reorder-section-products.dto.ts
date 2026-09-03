import { IsArray, IsNumber, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderSectionProductsDto {
  @ApiProperty({
    example: [5, 2, 9],
    description: 'IDs de productos en el orden de exhibición (el primero se destaca)',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  productIds: number[];
}
