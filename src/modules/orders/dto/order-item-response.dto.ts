import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty({ example: 1, description: 'Order item ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'Product ID' })
  productId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Product Variation ID' })
  productVariationId?: number;

  @ApiProperty({ example: 120.0, description: 'Price at time of order' })
  price: number;

  @ApiProperty({ example: 2, description: 'Quantity ordered' })
  quantity: number;

  @ApiProperty({ example: 240.0, description: 'Subtotal for this item' })
  subtotal: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Product name' })
  productName?: string;

  @ApiPropertyOptional({ description: 'Product image URL' })
  productImage?: string;

  @ApiPropertyOptional({ description: 'Variation ml size' })
  mlSize?: number;

  @ApiPropertyOptional({ description: 'Is full bottle' })
  isFullBottle?: boolean;

  constructor(item: any) {
    this.id = item.id;
    this.productId = item.productId;
    this.productVariationId = item.productVariationId;
    this.price = Number(item.price);
    this.quantity = item.quantity;
    this.subtotal = Number(item.subtotal);

    // Include product info if loaded
    if (item.product) {
      this.productName = item.product.name;
      this.productImage = item.product.imageUrl
        || item.product.images?.[0]?.url
        || null;
    }
    if (item.productVariation) {
      this.mlSize = Number(item.productVariation.mlSize);
      this.isFullBottle = item.productVariation.isFullBottle;
      // Use variation image if available, fallback to product image
      const variationImg = item.productVariation.images?.[0]?.url;
      if (variationImg) {
        this.productImage = variationImg;
      }
    }

    this.createdAt = item.createdAt;
    this.updatedAt = item.updatedAt;
  }
}