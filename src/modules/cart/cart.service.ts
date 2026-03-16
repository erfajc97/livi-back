import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariation } from '../products/entities/product-variation.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { CartItemResponseDto } from './dto/cart-item-response.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductVariation)
    private productVariationsRepository: Repository<ProductVariation>,
  ) {}

  /**
   * Get or create cart for user
   */
  private async getOrCreateCart(userId: number): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartRepository.create({ userId });
      cart = await this.cartRepository.save(cart);
    }

    return cart;
  }

  /**
   * Get cart with full details
   */
  async getCart(userId: number): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    // Load items with product/variation details
    const items = await this.cartItemRepository.find({
      where: { cartId: cart.id },
      relations: ['product', 'productVariation'],
    });

    // Build response DTOs with product info
    const itemDtos = await Promise.all(
      items.map(async (item) => {
        let product: Product | null = null;
        let variation: ProductVariation | null = null;

        if (item.productVariationId) {
          variation = await this.productVariationsRepository.findOne({
            where: { id: item.productVariationId },
            relations: ['product'],
          });
          product = variation?.product || null;
        } else if (item.productId) {
          product = await this.productsRepository.findOne({
            where: { id: item.productId },
          });
        }

        return new CartItemResponseDto(item, product, variation);
      }),
    );

    return new CartResponseDto(cart, itemDtos);
  }

  /**
   * Add item to cart
   */
  async addItem(userId: number, addCartItemDto: AddCartItemDto): Promise<CartResponseDto> {
    // Validate that either productId or productVariationId is provided, but not both
    if (!addCartItemDto.productId && !addCartItemDto.productVariationId) {
      throw new BadRequestException(
        'Either productId or productVariationId must be provided',
      );
    }

    if (addCartItemDto.productId && addCartItemDto.productVariationId) {
      throw new BadRequestException(
        'Cannot specify both productId and productVariationId',
      );
    }

    const cart = await this.getOrCreateCart(userId);

    let product: Product | null = null;
    let productVariation: ProductVariation | null = null;
    let productId: number | null = null;
    let productVariationId: number | null = null;

    if (addCartItemDto.productVariationId) {
      // Adding a specific variation
      productVariation = await this.productVariationsRepository.findOne({
        where: { id: addCartItemDto.productVariationId },
        relations: ['product'],
      });

      if (!productVariation) {
        throw new NotFoundException(
          `Product variation with ID ${addCartItemDto.productVariationId} not found`,
        );
      }

      if (!productVariation.isActive) {
        throw new BadRequestException(
          `Product variation with ID ${addCartItemDto.productVariationId} is not active`,
        );
      }

      product = productVariation.product;
      if (!product || !product.isActive) {
        throw new BadRequestException(
          `Product for variation ${addCartItemDto.productVariationId} is not active`,
        );
      }

      // Check stock availability
      if (productVariation.stock < addCartItemDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock for variation ${addCartItemDto.productVariationId}. Available: ${productVariation.stock}, Requested: ${addCartItemDto.quantity}`,
        );
      }

      productId = product.id;
      productVariationId = productVariation.id;
    } else if (addCartItemDto.productId) {
      // Adding base product
      product = await this.productsRepository.findOne({
        where: { id: addCartItemDto.productId },
        relations: ['variations'],
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${addCartItemDto.productId} not found`);
      }

      if (!product.isActive) {
        throw new BadRequestException(
          `Product with ID ${addCartItemDto.productId} is not active`,
        );
      }

      // Check if product has variations - if it does, user must add a variation to cart
      const activeVariations = product.variations?.filter((v) => v.isActive) || [];
      if (activeVariations.length > 0) {
        throw new BadRequestException(
          `Product with ID ${addCartItemDto.productId} has variations. You must add a specific variation to cart instead of the base product. Available variations: ${activeVariations.map((v) => v.id).join(', ')}`,
        );
      }

      // Check stock availability
      if (product.stock < addCartItemDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${addCartItemDto.productId}. Available: ${product.stock}, Requested: ${addCartItemDto.quantity}`,
        );
      }

      productId = product.id;
    }

    // Check if item already exists in cart
    const existingItem = await this.cartItemRepository.findOne({
      where: {
        cartId: cart.id,
        productId: productId || undefined,
        productVariationId: productVariationId || undefined,
      },
    });

    if (existingItem) {
      // Update quantity
      existingItem.quantity += addCartItemDto.quantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      // Create new cart item
      const cartItemData: any = {
        cartId: cart.id,
        quantity: addCartItemDto.quantity,
      };
      
      if (productId) {
        cartItemData.productId = productId;
      }
      
      if (productVariationId) {
        cartItemData.productVariationId = productVariationId;
      }
      
      const cartItem = this.cartItemRepository.create(cartItemData);
      await this.cartItemRepository.save(cartItem);
    }

    return this.getCart(userId);
  }

  /**
   * Update cart item quantity
   */
  async updateItem(
    userId: number,
    itemId: number,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cartId: cart.id },
      relations: ['product', 'productVariation'],
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found in your cart`);
    }

    // Validate stock availability
    if (cartItem.productVariationId) {
      const variation = await this.productVariationsRepository.findOne({
        where: { id: cartItem.productVariationId },
      });
      if (variation && variation.stock < updateCartItemDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${variation.stock}, Requested: ${updateCartItemDto.quantity}`,
        );
      }
    } else if (cartItem.productId) {
      const product = await this.productsRepository.findOne({
        where: { id: cartItem.productId },
      });
      if (product && product.stock < updateCartItemDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${product.stock}, Requested: ${updateCartItemDto.quantity}`,
        );
      }
    }

    cartItem.quantity = updateCartItemDto.quantity;
    await this.cartItemRepository.save(cartItem);

    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: number, itemId: number): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found in your cart`);
    }

    await this.cartItemRepository.remove(cartItem);

    return this.getCart(userId);
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: number): Promise<void> {
    const cart = await this.getOrCreateCart(userId);

    await this.cartItemRepository.delete({ cartId: cart.id });
  }

  /**
   * Convert cart items to order items format
   */
  async getCartItemsForOrder(userId: number) {
    const cart = await this.getOrCreateCart(userId);
    const items = await this.cartItemRepository.find({
      where: { cartId: cart.id },
    });

    return items.map((item) => ({
      productId: item.productId || undefined,
      productVariationId: item.productVariationId || undefined,
      quantity: item.quantity,
    }));
  }
}