import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LandingSection, SectionPlacement } from './entities/landing-section.entity';
import { Product } from '../products/entities/product.entity';
import { CreateLandingSectionDto } from './dto/create-landing-section.dto';
import { UpdateLandingSectionDto } from './dto/update-landing-section.dto';
import { LandingSectionResponseDto } from './dto/landing-section-response.dto';

function toIdList(ids: Array<string | number> | undefined | null): number[] {
  return (ids ?? []).map((id) => Number(id)).filter((id) => Number.isFinite(id));
}

function sortProductsByOrder(products: Product[], order: Array<string | number> | undefined): Product[] {
  if (!products?.length) return [];
  const rank = new Map(toIdList(order).map((id, index) => [id, index]));
  return [...products].sort((a, b) => {
    const ra = rank.get(Number(a.id));
    const rb = rank.get(Number(b.id));
    if (ra == null && rb == null) return 0;
    if (ra == null) return 1;
    if (rb == null) return -1;
    return ra - rb;
  });
}

@Injectable()
export class LandingSectionsService implements OnModuleInit {
  private readonly logger = new Logger(LandingSectionsService.name);

  constructor(
    @InjectRepository(LandingSection)
    private landingSectionsRepository: Repository<LandingSection>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.landingSectionsRepository.query(`
        ALTER TABLE "landing_sections"
        ADD COLUMN IF NOT EXISTS "productOrder" integer[] NOT NULL DEFAULT '{}'
      `);
    } catch (err) {
      this.logger.error(
        'No se pudo asegurar landing_sections.productOrder',
        err instanceof Error ? err.stack : err,
      );
    }
  }

  async create(createLandingSectionDto: CreateLandingSectionDto): Promise<LandingSection> {
    const { productIds, ...sectionData } = createLandingSectionDto;

    const section = this.landingSectionsRepository.create({
      ...sectionData,
      productOrder: toIdList(productIds),
    });

    if (productIds && productIds.length > 0) {
      const products = await this.productsRepository.findBy({ id: In(productIds) });
      if (products.length !== productIds.length) {
        throw new BadRequestException('One or more products not found');
      }
      section.products = sortProductsByOrder(products, productIds);
    }

    return this.saveSorted(section);
  }

  async findAll(): Promise<LandingSectionResponseDto[]> {
    const sections = await this.landingSectionsRepository.find({
      relations: ['products', 'products.marca', 'products.category', 'products.images', 'products.variations', 'products.variations.images'],
      order: { order: 'ASC' },
    });
    return sections.map((section) => new LandingSectionResponseDto(this.withSortedProducts(section)));
  }

  /** Secciones visibles, filtrables por ubicación (home / cart). */
  async findActive(placement?: SectionPlacement): Promise<LandingSectionResponseDto[]> {
    const sections = await this.landingSectionsRepository.find({
      where: { isActive: true, ...(placement ? { placement } : {}) },
      relations: ['products', 'products.marca', 'products.category', 'products.images', 'products.variations', 'products.variations.images'],
      order: { order: 'ASC' },
    });
    return sections.map((section) => new LandingSectionResponseDto(this.withSortedProducts(section)));
  }

  async findOne(id: number): Promise<LandingSection> {
    const section = await this.landingSectionsRepository.findOne({
      where: { id },
      relations: ['products', 'products.marca', 'products.category', 'products.images', 'products.variations', 'products.variations.images'],
    });

    if (!section) {
      throw new NotFoundException(`Landing section with ID ${id} not found`);
    }

    return this.withSortedProducts(section);
  }

  async update(id: number, updateLandingSectionDto: UpdateLandingSectionDto): Promise<LandingSection> {
    const section = await this.findOne(id);
    const { productIds, ...updateData } = updateLandingSectionDto;

    Object.assign(section, updateData);

    if (productIds !== undefined) {
      if (productIds.length > 0) {
        const products = await this.productsRepository.findBy({ id: In(productIds) });
        if (products.length !== productIds.length) {
          throw new BadRequestException('One or more products not found');
        }
        section.products = sortProductsByOrder(products, productIds);
        section.productOrder = toIdList(productIds);
      } else {
        section.products = [];
        section.productOrder = [];
      }
    }

    return this.saveSorted(section);
  }

  async addProduct(id: number, productId: number): Promise<LandingSection> {
    const section = await this.findOne(id);
    const product = await this.productsRepository.findOne({ where: { id: productId } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const existingProduct = section.products.find((p) => Number(p.id) === Number(productId));
    if (existingProduct) {
      throw new BadRequestException(`Product ${productId} is already in this section`);
    }

    section.products.push(product);
    section.productOrder = [...toIdList(section.productOrder), Number(productId)];
    return this.saveSorted(section);
  }

  async removeProduct(id: number, productId: number): Promise<LandingSection> {
    const section = await this.findOne(id);
    section.products = section.products.filter((p) => Number(p.id) !== Number(productId));
    section.productOrder = toIdList(section.productOrder).filter((idInOrder) => idInOrder !== Number(productId));
    return this.saveSorted(section);
  }

  async reorderProducts(id: number, productIds: number[]): Promise<LandingSection> {
    const section = await this.findOne(id);
    const currentIds = new Set(section.products.map((p) => Number(p.id)));
    const nextIds = toIdList(productIds);

    if (nextIds.length !== currentIds.size || nextIds.some((pid) => !currentIds.has(pid))) {
      throw new BadRequestException('El orden debe incluir exactamente los productos de la sección');
    }

    section.productOrder = nextIds;
    return this.saveSorted(section);
  }

  async remove(id: number): Promise<void> {
    const section = await this.findOne(id);
    await this.landingSectionsRepository.remove(section);
  }

  private withSortedProducts(section: LandingSection): LandingSection {
    const order = toIdList(section.productOrder);
    const fallback = order.length ? order : section.products.map((p) => Number(p.id));
    section.products = sortProductsByOrder(section.products ?? [], fallback);
    section.productOrder = fallback;
    return section;
  }

  private async saveSorted(section: LandingSection): Promise<LandingSection> {
    const saved = await this.landingSectionsRepository.save(section);
    return this.findOne(Number(saved.id));
  }
}
