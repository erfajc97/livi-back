import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Coupon, CouponType, CouponScope } from './entities/coupon.entity';
import { CouponUsage } from './entities/coupon-usage.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discount: number;
  freeShipping: boolean;
  message: string;
}

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private usageRepository: Repository<CouponUsage>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCouponDto): Promise<Coupon> {
    const existing = await this.couponRepository.findOne({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Coupon code "${dto.code}" already exists`);
    }

    const coupon = this.couponRepository.create({
      ...dto,
      code: dto.code.toUpperCase(),
    });

    if (dto.productIds?.length) {
      coupon.products = await this.productRepository.findBy({ id: In(dto.productIds) });
    }
    if (dto.categoryIds?.length) {
      coupon.categories = await this.categoryRepository.findBy({ id: In(dto.categoryIds) });
    }

    return this.couponRepository.save(coupon);
  }

  async findAll(): Promise<Coupon[]> {
    return this.couponRepository.find({
      relations: ['products', 'categories'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
      relations: ['products', 'categories'],
    });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    return coupon;
  }

  async update(id: number, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);

    if (dto.code) {
      dto.code = dto.code.toUpperCase();
    }

    if (dto.productIds !== undefined) {
      coupon.products = dto.productIds.length
        ? await this.productRepository.findBy({ id: In(dto.productIds) })
        : [];
    }
    if (dto.categoryIds !== undefined) {
      coupon.categories = dto.categoryIds.length
        ? await this.categoryRepository.findBy({ id: In(dto.categoryIds) })
        : [];
    }

    Object.assign(coupon, dto);
    delete (coupon as any).productIds;
    delete (coupon as any).categoryIds;

    return this.couponRepository.save(coupon);
  }

  async remove(id: number): Promise<void> {
    const coupon = await this.findOne(id);
    await this.couponRepository.remove(coupon);
  }

  async validate(
    dto: ValidateCouponDto,
    userId?: number,
  ): Promise<CouponValidationResult> {
    const coupon = await this.couponRepository.findOne({
      where: { code: dto.code.toUpperCase(), isActive: true },
      relations: ['products', 'categories'],
    });

    if (!coupon) {
      return { valid: false, discount: 0, freeShipping: false, message: 'Cupón no encontrado o inactivo' };
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { valid: false, discount: 0, freeShipping: false, message: 'Este cupón ha expirado' };
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return { valid: false, discount: 0, freeShipping: false, message: 'Este cupón ha alcanzado su límite de usos' };
    }

    if (userId && coupon.singleUsePerCustomer) {
      const usage = await this.usageRepository.findOne({
        where: { couponId: coupon.id, userId },
      });
      if (usage) {
        return { valid: false, discount: 0, freeShipping: false, message: 'Ya has utilizado este cupón' };
      }
    }

    if (coupon.minOrderAmount && dto.orderAmount < Number(coupon.minOrderAmount)) {
      return {
        valid: false,
        discount: 0,
        freeShipping: false,
        message: `El monto mínimo de compra es $${coupon.minOrderAmount}`,
      };
    }

    if (coupon.scope === CouponScope.SPECIFIC_PRODUCTS && dto.productIds?.length) {
      const couponProductIds = coupon.products.map((p) => Number(p.id));
      const hasMatch = dto.productIds.some((id) => couponProductIds.includes(id));
      if (!hasMatch) {
        return { valid: false, discount: 0, freeShipping: false, message: 'Este cupón no aplica a los productos en tu carrito' };
      }
    }

    if (coupon.scope === CouponScope.SPECIFIC_CATEGORIES && dto.categoryIds?.length) {
      const couponCategoryIds = coupon.categories.map((c) => Number(c.id));
      const hasMatch = dto.categoryIds.some((id) => couponCategoryIds.includes(id));
      if (!hasMatch) {
        return { valid: false, discount: 0, freeShipping: false, message: 'Este cupón no aplica a las categorías en tu carrito' };
      }
    }

    let discount = 0;
    let freeShipping = false;

    switch (coupon.type) {
      case CouponType.FIXED_AMOUNT:
        discount = Math.min(Number(coupon.value), dto.orderAmount);
        break;
      case CouponType.PERCENTAGE:
        discount = Math.round(dto.orderAmount * (Number(coupon.value) / 100) * 100) / 100;
        break;
      case CouponType.FREE_SHIPPING:
        freeShipping = true;
        break;
    }

    return { valid: true, coupon, discount, freeShipping, message: 'Cupón aplicado correctamente' };
  }

  async recordUsage(couponId: number, userId: number, orderId: number): Promise<void> {
    await this.usageRepository.save({
      couponId,
      userId,
      orderId,
    });
    await this.couponRepository.increment({ id: couponId }, 'currentUses', 1);
  }
}
