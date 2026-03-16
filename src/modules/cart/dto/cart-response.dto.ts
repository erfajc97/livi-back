import { ApiProperty } from '@nestjs/swagger';
import { CartItemResponseDto } from './cart-item-response.dto';

export class CartResponseDto {
  @ApiProperty({ example: 1, description: 'Cart ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'User ID who owns the cart' })
  userId: number;

  @ApiProperty({ type: [CartItemResponseDto], description: 'Items in the cart' })
  items: CartItemResponseDto[];

  @ApiProperty({ example: 360.0, description: 'Total cart value' })
  total: number;

  @ApiProperty({ example: 3, description: 'Total number of items in cart' })
  itemCount: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;

  constructor(cart: any, items: CartItemResponseDto[]) {
    this.id = cart.id;
    this.userId = cart.userId;
    this.items = items;
    this.total = items.reduce((sum, item) => sum + item.subtotal, 0);
    this.itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    this.createdAt = cart.createdAt;
    this.updatedAt = cart.updatedAt;
  }
}