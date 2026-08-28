import { ApiProperty } from '@nestjs/swagger';
import { orderedGallery, ProductImageResponseDto } from './product-image-response.dto';
import { ProductVideoResponseDto } from './product-video-response.dto';
import { PresentationType } from '../entities/product-variation.entity';

export class ProductVariationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  productId: number;

  @ApiProperty({ description: 'Decant size in ml or full bottle ml' })
  mlSize: number;

  @ApiProperty({ description: 'Whether this is a full sealed bottle variation' })
  isFullBottle: boolean;

  @ApiProperty({
    enum: PresentationType,
    description: "Tipo de presentación: 'decant' | 'sellada' | 'original'",
  })
  presentationType: PresentationType;

  @ApiProperty({ required: false })
  price?: number;

  @ApiProperty({ required: false, description: 'Override unit acquisition cost (admin)' })
  cost?: number;

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

  @ApiProperty({ description: 'Calculated available quantity for this variation' })
  availableQuantity: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(variation: any, productStock?: number, productTotalMl?: number, productOpenMl?: number) {
    this.id = variation.id;
    this.productId = variation.productId;
    this.mlSize = Number(variation.mlSize || 0);
    this.isFullBottle = variation.isFullBottle ?? false;
    // Fallback para registros antiguos o payloads parciales sin la columna.
    this.presentationType =
      variation.presentationType ??
      (this.isFullBottle ? PresentationType.SELLADA : PresentationType.DECANT);
    this.price = variation.price;
    this.cost = variation.cost ?? undefined;
    this.sku = variation.sku;
    this.name = variation.name;
    this.isActive = variation.isActive;

    // Calculate available quantity from product-level stock
    const stock = productStock ?? 0;
    const totalMl = productTotalMl ?? 100;
    const openMl = productOpenMl ?? 0;
    const mlSize = Number(variation.mlSize || 0);
    if (variation.isFullBottle) {
      this.availableQuantity = stock;
    } else if (mlSize > 0) {
      const totalAvailableMl = openMl + stock * totalMl;
      this.availableQuantity = Math.floor(totalAvailableMl / mlSize);
    } else {
      this.availableQuantity = 0;
    }

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
