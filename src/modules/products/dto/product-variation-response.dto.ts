import { ApiProperty } from '@nestjs/swagger';
import { orderedGallery, ProductImageResponseDto } from './product-image-response.dto';
import { ProductVideoResponseDto } from './product-video-response.dto';

export class ProductVariationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  productId: number;

  @ApiProperty({ required: false })
  price?: number;

  @ApiProperty({ required: false, description: 'Override unit acquisition cost (admin)' })
  cost?: number;

  @ApiProperty({ required: false })
  sku?: string;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false, description: 'Color del swatch en hexadecimal' })
  colorHex?: string;

  @ApiProperty({ required: false, description: 'Talla de la variante (combo color + talla)' })
  size?: string;

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

  @ApiProperty({ description: 'Available units (product-level stock)' })
  availableQuantity: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(variation: any, productStock?: number) {
    this.id = variation.id;
    this.productId = variation.productId;
    this.price = variation.price;
    this.cost = variation.cost ?? undefined;
    this.sku = variation.sku;
    this.name = variation.name;
    this.colorHex = variation.colorHex ?? undefined;
    this.size = variation.size ?? undefined;
    this.isActive = variation.isActive;

    // El stock vive a nivel producto: las unidades disponibles de la
    // variación son las unidades del producto.
    this.availableQuantity = productStock ?? 0;

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

    const gallery = orderedGallery(variation.images);
    if (gallery.length > 0) {
      this.images = gallery.map((image: any) => new ProductImageResponseDto(image));
    }

    if (variation.videos && variation.videos.length > 0) {
      this.videos = variation.videos.map((video: any) => new ProductVideoResponseDto(video));
    }
  }
}
