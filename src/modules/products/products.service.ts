import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariation } from './entities/product-variation.entity';
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
    @InjectRepository(ProductVariation)
    private variationsRepository: Repository<ProductVariation>,
    @InjectRepository(BottleEvent)
    private bottleEventRepository: Repository<BottleEvent>,
    private dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    const product = this.productsRepository.create(createProductDto);
    const savedProduct = await this.productsRepository.save(product);

    // Ensure every product has at least one full-bottle variation so manual
    // sales and orders always have a canonical sellable unit for the bottle.
    await this.ensureFullBottleVariation(savedProduct);

    return this.findOne(savedProduct.id);
  }

  /**
   * Create a full-bottle ProductVariation if the product doesn't have one yet.
   * Uses the product's totalMl / price as defaults.
   */
  private async ensureFullBottleVariation(product: Product): Promise<void> {
    const existing = await this.variationsRepository.findOne({
      where: { productId: product.id, isFullBottle: true },
    });

    if (existing) return;

    const totalMl = Number(product.totalMl) || 100;
    const sku = `${(product.name || 'product').toString().replace(/\s+/g, '-').toLowerCase().slice(0, 40)}-bottle-${product.id}`;

    const variation = this.variationsRepository.create({
      productId: product.id,
      isFullBottle: true,
      mlSize: totalMl,
      price: product.price,
      name: `${product.name} - Botella ${totalMl}ml`,
      sku,
      isActive: true,
    });

    await this.variationsRepository.save(variation);
  }

  /**
   * Keep the auto-managed full-bottle variation in sync with product price/totalMl.
   */
  private async syncFullBottleVariation(product: Product): Promise<void> {
    const variation = await this.variationsRepository.findOne({
      where: { productId: product.id, isFullBottle: true },
    });

    if (!variation) {
      await this.ensureFullBottleVariation(product);
      return;
    }

    const totalMl = Number(product.totalMl) || Number(variation.mlSize) || 100;
    variation.mlSize = totalMl;
    variation.price = product.price;
    await this.variationsRepository.save(variation);
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
      .leftJoinAndSelect('product.videos', 'videos')
      // Conteo de formatos comprables (frasco + decants) sin traer las filas
      // de variación: barato y no multiplica el resultado ni la paginación.
      .loadRelationCountAndMap(
        'product.variationsCount',
        'product.variations',
        'vcount',
        (qb) => qb.andWhere('vcount.isActive = :vcountActive', { vcountActive: true }),
      );

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

    // Rango de precio por producto (formato más barato / más caro) de las
    // variaciones activas de esta página. Una sola query agregada.
    const productIds = products.map((p) => p.id);
    if (productIds.length > 0) {
      const priceAgg = await this.variationsRepository
        .createQueryBuilder('v')
        .select('v.productId', 'productId')
        .addSelect('MIN(v.price)', 'min')
        .addSelect('MAX(v.price)', 'max')
        .where('v.productId IN (:...productIds)', { productIds })
        .andWhere('v.isActive = :vActive', { vActive: true })
        .groupBy('v.productId')
        .getRawMany();

      const priceById = new Map(
        priceAgg.map((r) => [String(r.productId), r]),
      );
      for (const product of products) {
        const r = priceById.get(String(product.id));
        if (r) {
          (product as any).minFormatPrice = Number(r.min);
          (product as any).maxFormatPrice = Number(r.max);
        }
      }
    }

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

    // Filter undefined keys so partial updates never overwrite stored values
    // with undefined (which TypeORM persists as NULL).
    const sanitized = Object.fromEntries(
      Object.entries(updateProductDto).filter(([, value]) => value !== undefined),
    ) as Partial<UpdateProductDto>;

    Object.assign(product, sanitized);
    const updatedProduct = await this.productsRepository.save(product);

    // Keep full-bottle variation aligned with product price / totalMl
    if (sanitized.price !== undefined || sanitized.totalMl !== undefined) {
      await this.syncFullBottleVariation(updatedProduct);
    }

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
      relations: ['category', 'marca', 'images', 'variations'],
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
      product: new ProductResponseDto(product, true),
      inventory: {
        stock,
        totalMl,
        openBottleMlRemaining: openMl,
        availableMl,
      },
      variations: (product.variations ?? []).map((v) => ({
        id: v.id,
        name: v.name,
        mlSize: Number(v.mlSize),
        price: Number(v.price ?? product.price),
        isFullBottle: v.isFullBottle,
        isActive: v.isActive,
      })),
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
