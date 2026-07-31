import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LandingSection, SectionPlacement } from './entities/landing-section.entity';
import { Product } from '../products/entities/product.entity';
import { CreateLandingSectionDto } from './dto/create-landing-section.dto';
import { UpdateLandingSectionDto } from './dto/update-landing-section.dto';

@Injectable()
export class LandingSectionsService {
  constructor(
    @InjectRepository(LandingSection)
    private landingSectionsRepository: Repository<LandingSection>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createLandingSectionDto: CreateLandingSectionDto): Promise<LandingSection> {
    const { productIds, ...sectionData } = createLandingSectionDto;

    const section = this.landingSectionsRepository.create(sectionData);

    if (productIds && productIds.length > 0) {
      const products = await this.productsRepository.findBy({ id: In(productIds) });
      if (products.length !== productIds.length) {
        throw new BadRequestException('One or more products not found');
      }
      section.products = products;
    }

    return this.landingSectionsRepository.save(section);
  }

  async findAll(): Promise<LandingSection[]> {
    return this.landingSectionsRepository.find({
      relations: ['products', 'products.marca', 'products.category', 'products.images', 'products.variations'],
      order: { order: 'ASC' },
    });
  }

  /** Secciones visibles, filtrables por ubicación (home / cart). */
  async findActive(placement?: SectionPlacement): Promise<LandingSection[]> {
    return this.landingSectionsRepository.find({
      where: { isActive: true, ...(placement ? { placement } : {}) },
      relations: ['products', 'products.marca', 'products.category', 'products.images', 'products.variations'],
      order: { order: 'ASC' },
    });
  }

  async findOne(id: number): Promise<LandingSection> {
    const section = await this.landingSectionsRepository.findOne({
      where: { id },
      relations: ['products', 'products.marca', 'products.category', 'products.images', 'products.variations'],
    });

    if (!section) {
      throw new NotFoundException(`Landing section with ID ${id} not found`);
    }

    return section;
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
        section.products = products;
      } else {
        section.products = [];
      }
    }

    return this.landingSectionsRepository.save(section);
  }

  async addProduct(id: number, productId: number): Promise<LandingSection> {
    const section = await this.findOne(id);
    const product = await this.productsRepository.findOne({ where: { id: productId } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if product is already in section
    const existingProduct = section.products.find(p => p.id === productId);
    if (existingProduct) {
      throw new BadRequestException(`Product ${productId} is already in this section`);
    }

    section.products.push(product);
    return this.landingSectionsRepository.save(section);
  }

  async removeProduct(id: number, productId: number): Promise<LandingSection> {
    const section = await this.findOne(id);
    section.products = section.products.filter(p => p.id !== productId);
    return this.landingSectionsRepository.save(section);
  }

  async remove(id: number): Promise<void> {
    const section = await this.findOne(id);
    await this.landingSectionsRepository.remove(section);
  }
}
