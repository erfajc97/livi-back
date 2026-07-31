import { ApiProperty } from '@nestjs/swagger';
import { ProductResponseDto } from '../../products/dto/product-response.dto';
import { SectionPlacement } from '../entities/landing-section.entity';

export class LandingSectionResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'ÚLTIMOS INGRESOS' })
  title: string;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ enum: SectionPlacement, example: SectionPlacement.HOME })
  placement: SectionPlacement;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: [ProductResponseDto] })
  products: ProductResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
