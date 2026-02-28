import { ApiProperty } from '@nestjs/swagger';

export class ProductVideoResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'https://bucket.s3.region.amazonaws.com/products/video.mp4' })
  url: string;

  @ApiProperty({ example: 'products/uuid.mp4' })
  key: string;

  @ApiProperty({ example: 'Product video title', required: false })
  title?: string;

  @ApiProperty({ example: 'Product video description', required: false })
  description?: string;

  @ApiProperty({ example: 0 })
  displayOrder: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(video: any) {
    this.id = video.id;
    this.url = video.url;
    this.key = video.key;
    this.title = video.title;
    this.description = video.description;
    this.displayOrder = video.displayOrder;
    this.isActive = video.isActive;
    this.createdAt = video.createdAt;
    this.updatedAt = video.updatedAt;
  }
}
