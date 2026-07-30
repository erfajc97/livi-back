import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner, BannerType } from './entities/banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { S3Service } from '../../common/services/s3.service';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private bannersRepository: Repository<Banner>,
    private s3Service: S3Service,
  ) {}

  async create(
    createBannerDto: CreateBannerDto,
    file?: Express.Multer.File,
  ): Promise<Banner> {
    if (file) {
      const uploaded = await this.s3Service.uploadFile(file, 'banners');
      createBannerDto.imageUrl = uploaded.url;
      createBannerDto.imageKey = uploaded.key;
    }
    // La columna `title` es NOT NULL: sin texto se guarda vacío (el front
    // simplemente no renderiza el titular).
    const banner = this.bannersRepository.create({
      ...createBannerDto,
      title: createBannerDto.title ?? '',
    });
    return this.bannersRepository.save(banner);
  }

  async findAll(): Promise<Banner[]> {
    return this.bannersRepository.find({
      order: { position: 'ASC', createdAt: 'DESC' },
      relations: ['category', 'marca'],
    });
  }

  async findByType(type: BannerType): Promise<Banner[]> {
    return this.bannersRepository.find({
      where: { type, isVisible: true },
      order: { position: 'ASC' },
      relations: ['category', 'marca'],
    });
  }

  async findVisible(): Promise<Banner[]> {
    return this.bannersRepository.find({
      where: { isVisible: true, type: BannerType.HERO },
      order: { position: 'ASC', createdAt: 'DESC' },
    });
  }

  async findByCategoryId(categoryId: number): Promise<Banner | null> {
    return this.bannersRepository.findOne({
      where: { categoryId, type: BannerType.CATEGORY, isVisible: true },
    });
  }

  async findByMarcaId(marcaId: number): Promise<Banner | null> {
    return this.bannersRepository.findOne({
      where: { marcaId, type: BannerType.BRAND, isVisible: true },
    });
  }

  async findOne(id: number): Promise<Banner> {
    const banner = await this.bannersRepository.findOne({
      where: { id },
      relations: ['category', 'marca'],
    });
    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }
    return banner;
  }

  async update(
    id: number,
    updateBannerDto: UpdateBannerDto,
    file?: Express.Multer.File,
  ): Promise<Banner> {
    const banner = await this.findOne(id);

    if (file) {
      if (banner.imageKey) {
        await this.s3Service.deleteFile(banner.imageKey);
      }
      const uploaded = await this.s3Service.uploadFile(file, 'banners');
      updateBannerDto.imageUrl = uploaded.url;
      updateBannerDto.imageKey = uploaded.key;
    }

    Object.assign(banner, updateBannerDto);
    return this.bannersRepository.save(banner);
  }

  async remove(id: number): Promise<void> {
    const banner = await this.findOne(id);
    if (banner.imageKey) {
      await this.s3Service.deleteFile(banner.imageKey);
    }
    await this.bannersRepository.remove(banner);
  }

  async reorder(orderedIds: number[]): Promise<void> {
    const updates = orderedIds.map((id, index) =>
      this.bannersRepository.update(id, { position: index }),
    );
    await Promise.all(updates);
  }

  async count(): Promise<number> {
    return this.bannersRepository.count();
  }

  async countVisible(): Promise<number> {
    return this.bannersRepository.count({ where: { isVisible: true } });
  }
}
