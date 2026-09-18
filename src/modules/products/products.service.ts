import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariation } from './entities/product-variation.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Category } from '../categories/entities/category.entity';
import { Marca } from '../categories/entities/marca.entity';
import { CreateProductDto, CreateProductVariantDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { orderedGallery } from './dto/product-image-response.dto';
import { FilterProductsDto } from './dto/filter-products.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductVariation)
    private variationsRepository: Repository<ProductVariation>,
    private dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    const { variants, ...productData } = createProductDto;
    const product = this.productsRepository.create(productData);
    const savedProduct = await this.productsRepository.save(product);

    // Variaciones enviadas en el alta (importación Excel: colores, etc.)
    if (variants?.length) {
      await this.createVariantsFromDto(savedProduct, variants);
    }

    return this.findOne(savedProduct.id);
  }

  /** Crea las variaciones (colores, tamaños…) enviadas en el alta del producto. */
  private async createVariantsFromDto(
    product: Product,
    variants: CreateProductVariantDto[],
  ): Promise<void> {
    const slug = (product.name || 'product')
      .toString()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // sin tildes/diacríticos en el SKU
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 40);
    const rows = variants
      .filter((v) => v && v.name != null && v.price != null)
      .map((v, i) => {
        const name = String(v.name).trim();
        const variantSlug = name
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .toLowerCase()
          .replace(/\s+/g, '-');
        return this.variationsRepository.create({
          productId: product.id,
          price: Number(v.price),
          cost: v.cost != null ? Number(v.cost) : undefined,
          name,
          sku:
            v.sku?.trim() ||
            `${slug}-${variantSlug}${v.size ? `-${String(v.size).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '-')}` : ''}-${product.id}${i > 0 ? `-${i}` : ''}`,
          colorHex: v.colorHex?.trim() || undefined,
          size: v.size?.trim() || undefined,
          isActive: v.isActive ?? true,
        });
      });
    if (rows.length) {
      await this.variationsRepository.save(rows);
    }
  }

  /**
   * Importación masiva (plantilla Excel del admin). Cada fila se valida y crea
   * de forma independiente: una fila mala no detiene el lote. `row` es el
   * número de fila del Excel (la 1 es el encabezado).
   *
   * Categoría y marca aceptan ID numérico **o nombre de texto** (los IDs
   * cambian entre entornos; el texto se resuelve por nombre, case-insensitive).
   */
  async bulkCreate(rows: CreateProductDto[]): Promise<{
    total: number;
    created: number;
    failed: number;
    results: { row: number; name?: string; success: boolean; id?: number; error?: string }[];
  }> {
    const results: { row: number; name?: string; success: boolean; id?: number; error?: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] ?? ({} as CreateProductDto);
      const excelRow = i + 2; // fila 1 = encabezados de la plantilla
      try {
        // ── Categoría / marca: por ID o por nombre ──
        const categoryId = await this.resolveCategoryId(row);
        const marcaId = await this.resolveMarcaId(row, categoryId);

        const missing: string[] = [];
        if (!row.name || !String(row.name).trim()) missing.push('nombre');
        if (row.price == null || Number.isNaN(Number(row.price))) missing.push('precio');
        if (categoryId == null) missing.push('categoria (ID o nombre)');
        if (marcaId == null) missing.push('marca (ID o nombre)');
        if (missing.length) {
          throw new BadRequestException(`Faltan campos obligatorios: ${missing.join(', ')}`);
        }

        const created = await this.create({
          ...row,
          name: String(row.name).trim(),
          price: Number(row.price),
          // El chequeo de `missing` ya garantizó que no son null.
          categoryId: categoryId!,
          marcaId: marcaId!,
        });
        results.push({ row: excelRow, name: row.name, success: true, id: Number(created.id) });
      } catch (error: any) {
        const message =
          error?.response?.message ?? error?.message ?? 'Error desconocido';
        results.push({
          row: excelRow,
          name: row?.name,
          success: false,
          error: Array.isArray(message) ? message.join('; ') : String(message),
        });
      }
    }

    return {
      total: rows.length,
      created: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /** categoryId numérico directo; si no, busca la categoría por nombre. */
  private async resolveCategoryId(row: any): Promise<number | null> {
    if (row.categoryId != null && !Number.isNaN(Number(row.categoryId))) {
      return Number(row.categoryId);
    }
    const name = String(row.category ?? row.categoryId ?? '').trim();
    if (!name) return null;
    const found = await this.dataSource.getRepository(Category).findOne({
      where: { name: ILike(name) },
    });
    if (!found) {
      throw new BadRequestException(`La categoría "${name}" no existe — créala primero en el admin`);
    }
    return Number(found.id);
  }

  /** marcaId numérico directo; si no, busca la marca por nombre (dentro de la
      categoría resuelta cuando hay). */
  private async resolveMarcaId(row: any, categoryId: number | null): Promise<number | null> {
    if (row.marcaId != null && !Number.isNaN(Number(row.marcaId))) {
      return Number(row.marcaId);
    }
    const name = String(row.marca ?? row.marcaId ?? '').trim();
    if (!name) return null;
    const found = await this.dataSource.getRepository(Marca).findOne({
      where: {
        name: ILike(name),
        ...(categoryId != null ? { categoryId } : {}),
      } as any,
    });
    if (!found) {
      throw new BadRequestException(`La marca "${name}" no existe — créala primero en el admin`);
    }
    return Number(found.id);
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

    // El listado ya filtraba variantes activas; el detalle no, y la ficha
    // mostraba colores/tallas dados de baja. Se ordena para que el selector
    // salga siempre igual.
    if (includeVariations && product.variations) {
      product.variations = product.variations
        .filter((variation) => variation.isActive)
        .sort(
          (a, b) =>
            (a.name ?? '').localeCompare(b.name ?? '') ||
            (a.size ?? '').localeCompare(b.size ?? ''),
        );
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
      isActive,
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

    // isActive llega como string ("true"/"false"); ausente → solo activos.
    const isActiveFilter =
      isActive === undefined || isActive === null || isActive === ''
        ? true
        : String(isActive) === 'true';
    queryBuilder.andWhere('product.isActive = :isActive', {
      isActive: isActiveFilter,
    });

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

    // Variaciones activas de la página actual. Una sola query; de ahí derivamos
    // conteo, rango de precio y la lista compacta que muestran las cards.
    const productIds = products.map((p) => p.id);
    if (productIds.length > 0) {
      const variations = await this.variationsRepository.find({
        where: { productId: In(productIds), isActive: true },
        // Imágenes de la variante: la card del front cambia la foto según la
        // variante elegida, así que el listado debe traerlas.
        relations: ['images'],
        select: {
          id: true,
          productId: true,
          name: true,
          price: true,
          images: { id: true, url: true, displayOrder: true, isActive: true },
        },
      });

      const byProduct = new Map<string, ProductVariation[]>();
      for (const v of variations) {
        const key = String(v.productId);
        if (!byProduct.has(key)) byProduct.set(key, []);
        byProduct.get(key)!.push(v);
      }

      for (const product of products) {
        const vs = byProduct.get(String(product.id)) ?? [];
        vs.sort((a, b) => Number(a.price) - Number(b.price));
        (product as any).variationsCount = vs.length;
        if (vs.length) {
          const prices = vs.map((v) => Number(v.price));
          (product as any).minFormatPrice = Math.min(...prices);
          (product as any).maxFormatPrice = Math.max(...prices);
        }
        (product as any).formats = vs.map((v) => {
          // Primera foto de la variante, ya ordenada por displayOrder.
          const images = orderedGallery(v.images as any);
          return {
            id: v.id,
            name: v.name ?? undefined,
            price: Number(v.price),
            imageUrl: images[0]?.url ?? undefined,
            colorHex: v.colorHex ?? undefined,
            size: v.size ?? undefined,
          };
        });
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

    return this.findOne(updatedProduct.id);
  }

  /**
   * Elimina un producto.
   *
   * Variaciones, imágenes y videos caen por cascada, pero carritos, combos y
   * pedidos apuntan al producto sin cascada: al borrarlo a secas Postgres
   * rechazaba la operación y salía un 500 sin explicación.
   *
   * Un producto vendido no se borra por defecto —rompería el histórico de
   * pedidos—; en ese caso se responde 409 y el admin decide: lo desactiva, o
   * repite con `force` para borrarlo igual. Con `force` los ítems de pedido no
   * se borran: se desvinculan (productId → NULL) y conservan su precio,
   * cantidad y subtotal, así que el total del pedido sigue cuadrando aunque el
   * nombre del producto ya no se pueda mostrar.
   *
   * Si solo está en carritos o combos, esas referencias se limpian siempre y
   * el producto se va sin necesidad de `force`.
   */
  async remove(id: number, force = false): Promise<void> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['variations'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const variationIds = (product.variations ?? []).map((v) => v.id);

    const orderItemsQuery = this.dataSource
      .getRepository(OrderItem)
      .createQueryBuilder('oi')
      .where('oi.productId = :id', { id });
    if (variationIds.length) {
      orderItemsQuery.orWhere('oi.productVariationId IN (:...variationIds)', { variationIds });
    }
    const soldCount = await orderItemsQuery.getCount();

    if (soldCount > 0 && !force) {
      throw new ConflictException(
        `No se puede eliminar "${product.name}": tiene ${soldCount} ` +
          `${soldCount === 1 ? 'pedido asociado' : 'pedidos asociados'} y se perdería el historial. ` +
          'Desactívalo para que deje de aparecer en la tienda.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      // Historial de pedidos: se desvincula, no se borra. El ítem conserva
      // precio, cantidad y subtotal, así que el total del pedido no cambia.
      if (soldCount > 0) {
        await manager
          .createQueryBuilder()
          .update('order_items')
          .set({ productId: null })
          .where('productId = :id', { id })
          .execute();

        if (variationIds.length) {
          await manager
            .createQueryBuilder()
            .update('order_items')
            .set({ productVariationId: null })
            .where('productVariationId IN (:...variationIds)', { variationIds })
            .execute();
        }
      }

      // Carritos abiertos que lo tengan dentro
      await manager
        .createQueryBuilder()
        .delete()
        .from('cart_items')
        .where('productId = :id', { id })
        .execute();

      // Combos que lo incluyen (el combo queda sin ese ítem, no se borra)
      await manager
        .createQueryBuilder()
        .delete()
        .from('combo_products')
        .where('productId = :id', { id })
        .execute();

      // Secciones del home que lo tengan seleccionado
      await manager.query('DELETE FROM landing_section_products WHERE "productId" = $1', [id]);

      if (variationIds.length) {
        await manager
          .createQueryBuilder()
          .delete()
          .from('cart_items')
          .where('productVariationId IN (:...variationIds)', { variationIds })
          .execute();

        await manager
          .createQueryBuilder()
          .delete()
          .from('combo_products')
          .where('productVariationId IN (:...variationIds)', { variationIds })
          .execute();
      }

      await manager.remove(product);
    });
  }

  /**
   * Get detailed inventory info for a product including order history.
   */
  async getInventoryDetail(id: number) {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'marca', 'images', 'variations'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const orderItems = await this.dataSource
      .getRepository(OrderItem)
      .createQueryBuilder('oi')
      .leftJoinAndSelect('oi.order', 'order')
      .leftJoinAndSelect('oi.productVariation', 'variation')
      .where('oi.productId = :id', { id })
      .orderBy('order.createdAt', 'DESC')
      .take(50)
      .getMany();

    return {
      product: new ProductResponseDto(product, true),
      inventory: {
        stock: Number(product.stock || 0),
      },
      variations: (product.variations ?? []).map((v) => ({
        id: v.id,
        name: v.name,
        price: Number(v.price ?? product.price),
        isActive: v.isActive,
      })),
      orderHistory: orderItems.map((oi) => ({
        orderId: oi.order?.id,
        orderNumber: oi.order?.orderNumber,
        orderStatus: oi.order?.status,
        variationName: oi.productVariation?.name,
        quantity: oi.quantity,
        price: Number(oi.price),
        orderCreatedAt: oi.order?.createdAt,
      })),
    };
  }
}
