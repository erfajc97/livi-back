import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Combo } from './entities/combo.entity';
import { ComboProduct } from './entities/combo-product.entity';
import { Product } from '../products/entities/product.entity';
import { CreateComboDto } from './dto/create-combo.dto';
import { UpdateComboDto } from './dto/update-combo.dto';
import { S3Service } from '../../common/services/s3.service';

// Relaciones de los productos de un combo.
const PRODUCT_RELATIONS = [
  'comboProducts',
  'comboProducts.product',
  'comboProducts.product.images',
  'comboProducts.productVariation',
  'comboProducts.productVariation.images',
];
// Mismas relaciones para las versiones anidadas.
const VERSION_RELATIONS = PRODUCT_RELATIONS.map((r) => `versions.${r}`);
const FULL_RELATIONS = [...PRODUCT_RELATIONS, 'versions', ...VERSION_RELATIONS];

@Injectable()
export class CombosService {
  constructor(
    @InjectRepository(Combo)
    private comboRepository: Repository<Combo>,
    @InjectRepository(ComboProduct)
    private comboProductRepository: Repository<ComboProduct>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private s3Service: S3Service,
  ) {}

  async create(dto: CreateComboDto, file?: Express.Multer.File): Promise<Combo> {
    // Validate all products exist
    for (const item of dto.products) {
      const product = await this.productRepository.findOneBy({ id: item.productId as any });
      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }
    }

    // Si es una versión, hereda el nombre del combo base (mismo nombre).
    let name = dto.name;
    const parentComboId = dto.parentComboId ?? null;
    if (parentComboId != null) {
      const parent = await this.comboRepository.findOneBy({ id: parentComboId as any });
      if (!parent) {
        throw new NotFoundException(`Parent combo with ID ${parentComboId} not found`);
      }
      if (parent.parentComboId != null) {
        // Solo un nivel: una versión no puede ser padre de otra versión.
        throw new NotFoundException('No se puede crear una versión de otra versión');
      }
      name = parent.name;
    }

    // Handle image upload
    let imageUrl = dto.imageUrl;
    let imageKey: string | undefined;
    if (file) {
      const uploaded = await this.s3Service.uploadFile(file, 'combos');
      imageUrl = uploaded.url;
      imageKey = uploaded.key;
    }

    const combo = this.comboRepository.create({
      name,
      description: dto.description,
      imageUrl,
      imageKey,
      finalPrice: dto.finalPrice,
      discount: dto.discount ?? 0,
      isActive: dto.isActive ?? true,
      parentComboId,
    });

    const savedCombo = await this.comboRepository.save(combo);

    // Create combo products
    const comboProducts = dto.products.map((item) =>
      this.comboProductRepository.create({
        comboId: savedCombo.id,
        productId: item.productId,
        productVariationId: item.productVariationId,
        quantity: item.quantity ?? 1,
      }),
    );
    await this.comboProductRepository.save(comboProducts);

    return this.findOne(savedCombo.id);
  }

  async findAll(): Promise<Combo[]> {
    // Solo combos base (las versiones vienen anidadas en `versions`).
    return this.comboRepository.find({
      where: { parentComboId: IsNull() },
      relations: FULL_RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Combo[]> {
    // Público: solo combos base activos, con sus versiones anidadas.
    return this.comboRepository.find({
      where: { isActive: true, parentComboId: IsNull() },
      relations: FULL_RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Combo> {
    const combo = await this.comboRepository.findOne({
      where: { id: id as any },
      relations: FULL_RELATIONS,
    });
    if (!combo) {
      throw new NotFoundException(`Combo with ID ${id} not found`);
    }
    return combo;
  }

  async update(id: number, dto: UpdateComboDto, file?: Express.Multer.File): Promise<Combo> {
    const combo = await this.findOne(id);

    // Update basic fields
    if (dto.name !== undefined) combo.name = dto.name;
    if (dto.description !== undefined) combo.description = dto.description;
    if (dto.finalPrice !== undefined) combo.finalPrice = dto.finalPrice;
    if (dto.discount !== undefined) combo.discount = dto.discount;
    if (dto.isActive !== undefined) combo.isActive = dto.isActive;

    // Handle image upload
    if (file) {
      if (combo.imageKey) {
        await this.s3Service.deleteFile(combo.imageKey);
      }
      const uploaded = await this.s3Service.uploadFile(file, 'combos');
      combo.imageUrl = uploaded.url;
      combo.imageKey = uploaded.key;
    }

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
          productVariationId: item.productVariationId,
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
