import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CartItemResponseDto {
  @ApiProperty({ example: 1, description: 'Cart item ID' })
  id: number;

  @ApiPropertyOptional({ example: 1, description: 'Product ID' })
  productId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Product Variation ID' })
  productVariationId?: number;

  @ApiProperty({ example: 2, description: 'Quantity in cart' })
  quantity: number;

  @ApiProperty({ example: 120.0, description: 'Current price of the product/variation' })
  price: number;

  @ApiProperty({ example: 240.0, description: 'Subtotal (price * quantity)' })
  subtotal: number;

  @ApiProperty({ example: 'Paco Rabanne', description: 'Product name' })
  productName: string;

  @ApiPropertyOptional({ example: 'XL - Green', description: 'Variation name if applicable' })
  variationName?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;

  constructor(item: any, product?: any, variation?: any) {
    this.id = item.id;
    this.productId = item.productId;
    this.productVariationId = item.productVariationId;
    this.quantity = item.quantity;
    this.createdAt = item.createdAt;
    this.updatedAt = item.updatedAt;

    // Set price and product info
    if (variation) {
      this.price = Number(variation.price || product?.price || 0);
      this.productName = product?.name || '';
      this.variationName = variation.name;
    } else if (product) {
      this.price = Number(product.price || 0);
      this.productName = product.name || '';
    } else {
      this.price = 0;
      this.productName = '';
    }

    this.subtotal = this.price * this.quantity;
  }
}