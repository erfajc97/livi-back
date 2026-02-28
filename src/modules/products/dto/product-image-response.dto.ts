import { ApiProperty } from '@nestjs/swagger';

export class ProductImageResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'https://bucket.s3.region.amazonaws.com/products/image.jpg' })
  url: string;

  @ApiProperty({ example: 'products/uuid.jpg' })
  key: string;

  @ApiProperty({ example: 'Product image alt text', required: false })
  alt?: string;

  @ApiProperty({ example: 0 })
  displayOrder: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(image: any) {
    this.id = image.id;
    this.url = image.url;
    this.key = image.key;
    this.alt = image.alt;
    this.displayOrder = image.displayOrder;
    this.isActive = image.isActive;
    this.createdAt = image.createdAt;
    this.updatedAt = image.updatedAt;
  }
}
