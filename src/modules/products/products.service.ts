import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { BottleEvent } from './entities/bottle-event.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { FilterProductsDto } from './dto/filter-products.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(BottleEvent)
    private bottleEventRepository: Repository<BottleEvent>,
    private dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    const product = this.productsRepository.create(createProductDto);
    const savedProduct = await this.productsRepository.save(product);

    return this.findOne(savedProduct.id);
  }

  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.productsRepository.find({
      relations: ['category', 'marca', 'images', 'videos'],
    });

    return products.map((product) => new ProductResponseDto(product));
  }

  async findOne(id: number, includeVariations: boolean = false): Promise<ProductResponseDto> {
    const relations = ['category', 'marca', 'images', 'videos'];
    if (includeVariations) {
      relations.push(
        'variations',
        'variations.optionValues',
        'variations.optionValues.option',
        'variations.images',
        'variations.videos',
      );
    }

    const product = await this.productsRepository.findOne({
      where: { id },
      relations,
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return new ProductResponseDto(product, includeVariations);
  }

  /**
   * Find products with pagination and filtering
   */
  async findWithFilters(filterDto: FilterProductsDto): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const {
      page = 1,
      limit = 20,
      categoryId,
      marcaId,
      search,
      minPrice,
      maxPrice,
      isActive = true,
      bajoPedido,
      gender,
      timeOfDay,
      concentration,
      projection,
      hasDiscount,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    const queryBuilder = this.productsRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.marca', 'marca')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.videos', 'videos');

    // Apply filters
    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (marcaId) {
      queryBuilder.andWhere('product.marcaId = :marcaId', { marcaId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive });
    }

    if (bajoPedido !== undefined && bajoPedido !== null) {
      const bajoPedidoBool = String(bajoPedido) === 'true';
      queryBuilder.andWhere('product.bajoPedido = :bajoPedido', { bajoPedido: bajoPedidoBool });
    }

    if (gender) {
      queryBuilder.andWhere('product.gender = :gender', { gender });
    }

    if (timeOfDay) {
      queryBuilder.andWhere('product.timeOfDay = :timeOfDay', { timeOfDay });
    }

    if (concentration) {
      queryBuilder.andWhere('product.concentration = :concentration', { concentration });
    }

    if (projection) {
      queryBuilder.andWhere('product.projection = :projection', { projection });
    }

    if (hasDiscount !== undefined && hasDiscount !== null) {
      const hasDiscountBool = String(hasDiscount) === 'true';
      if (hasDiscountBool) {
        queryBuilder.andWhere('product.discount IS NOT NULL AND product.discount > 0');
      }
    }

    // Validate and apply sorting
    const allowedSortFields = ['name', 'price', 'createdAt', 'updatedAt', 'discount', 'salesCount'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`product.${sortField}`, order);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Get results and total count
    const [products, total] = await queryBuilder.getManyAndCount();

    // Map to DTOs
    const data = products.map((product) => new ProductResponseDto(product, false));

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findByCategory(categoryId: number): Promise<ProductResponseDto[]> {
    const products = await this.productsRepository.find({
      where: { categoryId },
      relations: ['category', 'marca', 'images', 'videos'],
    });

    return products.map((product) => new ProductResponseDto(product));
  }

  async findByMarca(marcaId: number): Promise<ProductResponseDto[]> {
    const products = await this.productsRepository.find({
      where: { marcaId },
      relations: ['category', 'marca', 'images', 'videos'],
    });

    return products.map((product) => new ProductResponseDto(product));
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    const product = await this.productsRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productsRepository.save(product);

    return this.findOne(updatedProduct.id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.productsRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await this.productsRepository.remove(product);
  }

  /**
   * Get detailed inventory info for a product including bottle events and order history.
   */
  async getInventoryDetail(id: number) {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'marca', 'images'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const bottleEvents = await this.bottleEventRepository.find({
      where: { productId: id },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const orderItems = await this.dataSource
      .getRepository(OrderItem)
      .createQueryBuilder('oi')
      .leftJoinAndSelect('oi.order', 'order')
      .leftJoinAndSelect('oi.productVariation', 'variation')
      .where('oi.productId = :id', { id })
      .orderBy('order.createdAt', 'DESC')
      .take(50)
      .getMany();

    const totalMl = Number(product.totalMl || 0);
    const stock = Number(product.stock || 0);
    const openMl = Number(product.openBottleMlRemaining || 0);
    const availableMl = openMl + stock * totalMl;

    return {
      product: new ProductResponseDto(product),
      inventory: {
        stock,
        totalMl,
        openBottleMlRemaining: openMl,
        availableMl,
      },
      bottleEvents: bottleEvents.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        sealedBottlesBefore: e.sealedBottlesBefore,
        sealedBottlesAfter: e.sealedBottlesAfter,
        openMlBefore: Number(e.openMlBefore),
        openMlAfter: Number(e.openMlAfter),
        note: e.note,
        createdBy: e.createdBy,
        createdAt: e.createdAt,
      })),
      orderHistory: orderItems.map((oi) => ({
        orderId: oi.order?.id,
        orderNumber: oi.order?.orderNumber,
        orderStatus: oi.order?.status,
        variationName: oi.productVariation?.name,
        mlSize: Number(oi.productVariation?.mlSize || 0),
        isFullBottle: oi.productVariation?.isFullBottle ?? false,
        quantity: oi.quantity,
        mlDeducted: Number(oi.mlDeducted || 0),
        bottlesOpened: oi.bottlesOpened || 0,
        price: Number(oi.price),
        orderCreatedAt: oi.order?.createdAt,
      })),
    };
  }
}
