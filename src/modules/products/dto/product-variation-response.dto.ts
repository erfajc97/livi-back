import { ApiProperty } from '@nestjs/swagger';
import { ProductImageResponseDto } from './product-image-response.dto';
import { ProductVideoResponseDto } from './product-video-response.dto';

export class ProductVariationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  productId: number;

  @ApiProperty({ required: false })
  price?: number;

  @ApiProperty()
  stock: number;

  @ApiProperty({ required: false })
  sku?: string;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty()
  optionValues: Array<{
    id: number;
    value: string;
    displayName?: string;
    option: {
      id: number;
      name: string;
    };
  }>;

  @ApiProperty({ type: [ProductImageResponseDto], required: false })
  images?: ProductImageResponseDto[];

  @ApiProperty({ type: [ProductVideoResponseDto], required: false })
  videos?: ProductVideoResponseDto[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(variation: any) {
    this.id = variation.id;
    this.productId = variation.productId;
    this.price = variation.price;
    this.stock = variation.stock;
    this.sku = variation.sku;
    this.name = variation.name;
    this.isActive = variation.isActive;
    this.createdAt = variation.createdAt;
    this.updatedAt = variation.updatedAt;

    if (variation.optionValues && variation.optionValues.length > 0) {
      this.optionValues = variation.optionValues.map((ov: any) => ({
        id: ov.id,
        value: ov.value,
        displayName: ov.displayName,
        option: {
          id: ov.option.id,
          name: ov.option.name,
        },
      }));
    } else {
      this.optionValues = [];
    }

    if (variation.images && variation.images.length > 0) {
      this.images = variation.images.map((image: any) => new ProductImageResponseDto(image));
    }

    if (variation.videos && variation.videos.length > 0) {
      this.videos = variation.videos.map((video: any) => new ProductVideoResponseDto(video));
    }
  }
}
