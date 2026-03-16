import { ApiProperty } from '@nestjs/swagger';
import { ProductType, MeasureUnit } from '../entities/product.entity';
import { ProductVariationResponseDto } from './product-variation-response.dto';
import { ProductImageResponseDto } from './product-image-response.dto';
import { ProductVideoResponseDto } from './product-video-response.dto';

export class ProductResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  type: ProductType;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  imageUrl?: string;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  measureValue?: number;

  @ApiProperty({ required: false })
  measureUnit?: MeasureUnit;

  @ApiProperty()
  categoryId: number;

  @ApiProperty()
  subcategoryId: number;

  @ApiProperty({ required: false })
  parentProductId?: number;

  @ApiProperty({ type: [ProductResponseDto], required: false })
  decants?: ProductResponseDto[];

  @ApiProperty({ type: [ProductVariationResponseDto], required: false })
  variations?: ProductVariationResponseDto[];

  @ApiProperty({ type: [ProductImageResponseDto], required: false })
  images?: ProductImageResponseDto[];

  @ApiProperty({ type: [ProductVideoResponseDto], required: false })
  videos?: ProductVideoResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(product: any, includeVariations: boolean = false) {
    this.id = product.id;
    this.name = product.name;
    this.brand = product.brand;
    this.price = product.price;
    this.type = product.type;
    this.description = product.description;
    this.imageUrl = product.imageUrl;
    this.stock = product.stock;
    this.isActive = product.isActive;
    this.measureValue = product.measureValue;
    this.measureUnit = product.measureUnit;
    this.categoryId = product.categoryId;
    this.subcategoryId = product.subcategoryId;
    this.parentProductId = product.parentProductId;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;

    if (product.decants && product.decants.length > 0) {
      this.decants = product.decants.map((decant: any) => new ProductResponseDto(decant));
    }

    if (includeVariations && product.variations && product.variations.length > 0) {
      this.variations = product.variations.map((variation: any) => new ProductVariationResponseDto(variation));
    }

    if (product.images && product.images.length > 0) {
      this.images = product.images.map((image: any) => new ProductImageResponseDto(image));
    }

    if (product.videos && product.videos.length > 0) {
      this.videos = product.videos.map((video: any) => new ProductVideoResponseDto(video));
    }
  }
}
