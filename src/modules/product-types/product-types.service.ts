import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ProductTypeEntity } from './entities/product-type.entity';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';

@Injectable()
export class ProductTypesService {
  constructor(
    @InjectRepository(ProductTypeEntity)
    private readonly repo: Repository<ProductTypeEntity>,
  ) {}

  private generateSlug(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(dto: CreateProductTypeDto): Promise<ProductTypeEntity> {
    const entity = this.repo.create({
      ...dto,
      slug: this.generateSlug(dto.name),
    });
    return this.repo.save(entity);
  }

  async findAll(search?: string): Promise<ProductTypeEntity[]> {
    const where: any = {};
    if (search) {
      where.name = ILike(`%${search}%`);
    }
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<ProductTypeEntity> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Tipo de producto con ID ${id} no encontrado`);
    }
    return entity;
  }

  async update(id: number, dto: UpdateProductTypeDto): Promise<ProductTypeEntity> {
    const entity = await this.findOne(id);
    if (dto.name) {
      entity.slug = this.generateSlug(dto.name);
    }
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
  }
}
