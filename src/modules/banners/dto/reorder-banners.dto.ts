import { IsArray, IsNumber, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderBannersDto {
  @ApiProperty({
    example: [3, 1, 2],
    description: 'Array of banner IDs in the desired display order',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  orderedIds: number[];
}
