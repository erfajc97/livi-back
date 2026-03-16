import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Combo } from './entities/combo.entity';
import { ComboProduct } from './entities/combo-product.entity';
import { Product } from '../products/entities/product.entity';
import { CreateComboDto } from './dto/create-combo.dto';
import { UpdateComboDto } from './dto/update-combo.dto';

@Injectable()
export class CombosService {
  constructor(
    @InjectRepository(Combo)
    private comboRepository: Repository<Combo>,
    @InjectRepository(ComboProduct)
    private comboProductRepository: Repository<ComboProduct>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(dto: CreateComboDto): Promise<Combo> {
    // Validate all products exist
    for (const item of dto.products) {
      const product = await this.productRepository.findOneBy({ id: item.productId as any });
      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }
    }

    const combo = this.comboRepository.create({
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl,
      finalPrice: dto.finalPrice,
      sizeLabel: dto.sizeLabel,
      isActive: dto.isActive ?? true,
    });

    const savedCombo = await this.comboRepository.save(combo);

    // Create combo products
    const comboProducts = dto.products.map((item) =>
      this.comboProductRepository.create({
        comboId: savedCombo.id,
        productId: item.productId,
        quantity: item.quantity ?? 1,
      }),
    );
    await this.comboProductRepository.save(comboProducts);

    return this.findOne(savedCombo.id);
  }

  async findAll(): Promise<Combo[]> {
    return this.comboRepository.find({
      relations: ['comboProducts', 'comboProducts.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Combo[]> {
    return this.comboRepository.find({
      where: { isActive: true },
      relations: ['comboProducts', 'comboProducts.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Combo> {
    const combo = await this.comboRepository.findOne({
      where: { id: id as any },
      relations: ['comboProducts', 'comboProducts.product'],
    });
    if (!combo) {
      throw new NotFoundException(`Combo with ID ${id} not found`);
    }
    return combo;
  }

  async update(id: number, dto: UpdateComboDto): Promise<Combo> {
    const combo = await this.findOne(id);

    // Update basic fields
    if (dto.name !== undefined) combo.name = dto.name;
    if (dto.description !== undefined) combo.description = dto.description;
    if (dto.imageUrl !== undefined) combo.imageUrl = dto.imageUrl;
    if (dto.finalPrice !== undefined) combo.finalPrice = dto.finalPrice;
    if (dto.sizeLabel !== undefined) combo.sizeLabel = dto.sizeLabel;
    if (dto.isActive !== undefined) combo.isActive = dto.isActive;

    await this.comboRepository.save(combo);

    // If products array is provided, replace all combo products
    if (dto.products) {
      // Validate all products exist
      for (const item of dto.products) {
        const product = await this.productRepository.findOneBy({ id: item.productId as any });
        if (!product) {
          throw new NotFoundException(`Product with ID ${item.productId} not found`);
        }
      }

      // Remove old combo products
      await this.comboProductRepository.delete({ comboId: combo.id as any });

      // Create new ones
      const comboProducts = dto.products.map((item) =>
        this.comboProductRepository.create({
          comboId: combo.id,
          productId: item.productId,
          quantity: item.quantity ?? 1,
        }),
      );
      await this.comboProductRepository.save(comboProducts);
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const combo = await this.findOne(id);
    await this.comboRepository.remove(combo);
  }

  async count(): Promise<number> {
    return this.comboRepository.count();
  }

  async countActive(): Promise<number> {
    return this.comboRepository.count({ where: { isActive: true } });
  }
}
