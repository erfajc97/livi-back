import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/constants/roles.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('cart')
@ApiBearerAuth('JWT-auth')
@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Get cart', description: 'Get current user\'s cart with all items' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully', type: CartResponseDto })
  getCart(@CurrentUser() user: User): Promise<CartResponseDto> {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Add item to cart', description: 'Add a product or variation to the cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart successfully', type: CartResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request (invalid item, insufficient stock, etc.)' })
  @ApiResponse({ status: 404, description: 'Product or variation not found' })
  addItem(
    @Body() addCartItemDto: AddCartItemDto,
    @CurrentUser() user: User,
  ): Promise<CartResponseDto> {
    return this.cartService.addItem(user.id, addCartItemDto);
  }

  @Patch('items/:id')
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Update cart item', description: 'Update the quantity of an item in the cart' })
  @ApiParam({ name: 'id', type: 'number', description: 'Cart item ID' })
  @ApiResponse({ status: 200, description: 'Cart item updated successfully', type: CartResponseDto })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  @ApiResponse({ status: 400, description: 'Bad request (insufficient stock, etc.)' })
  updateItem(
    @Param('id') id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @CurrentUser() user: User,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItem(user.id, +id, updateCartItemDto);
  }

  @Delete('items/:id')
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Remove item from cart', description: 'Remove an item from the cart' })
  @ApiParam({ name: 'id', type: 'number', description: 'Cart item ID' })
  @ApiResponse({ status: 200, description: 'Item removed from cart successfully', type: CartResponseDto })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  removeItem(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(user.id, +id);
  }

  @Delete()
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Clear cart', description: 'Remove all items from the cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully' })
  clearCart(@CurrentUser() user: User): Promise<void> {
    return this.cartService.clearCart(user.id);
  }
}