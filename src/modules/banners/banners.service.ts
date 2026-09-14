import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Banner, BannerType } from './entities/banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { CloudinaryService } from '../../common/services/cloudinary.service';

const BANNER_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/** ChatGPT y algunos SO mandan image/webp como octet-stream. */
function withImageMime(file: Express.Multer.File): Express.Multer.File {
  if (BANNER_IMAGE_TYPES.includes(file.mimetype)) return file;
  const ext = file.originalname.split('.').pop()?.toLowerCase() ?? '';
  const mime = EXT_TO_MIME[ext];
  if (mime) file.mimetype = mime;
  return file;
}

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private bannersRepository: Repository<Banner>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createBannerDto: CreateBannerDto,
    file?: Express.Multer.File,
    mobileFile?: Express.Multer.File,
  ): Promise<Banner> {
    if (file) {
      const uploaded = await this.cloudinaryService.uploadFile(
        withImageMime(file),
        'banners',
        BANNER_IMAGE_TYPES,
      );
      createBannerDto.imageUrl = uploaded.url;
      createBannerDto.imageKey = uploaded.key;
    }
    if (mobileFile) {
      const uploaded = await this.cloudinaryService.uploadFile(
        withImageMime(mobileFile),
        'banners',
        BANNER_IMAGE_TYPES,
      );
      createBannerDto.mobileImageUrl = uploaded.url;
      createBannerDto.mobileImageKey = uploaded.key;
    }
    // La columna `title` es NOT NULL: sin texto se guarda vacío (el front
    // simplemente no renderiza el titular).
    const banner = this.bannersRepository.create({
      ...createBannerDto,
      title: createBannerDto.title ?? '',
    });
    return this.saveBanner(banner);
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
    mobileFile?: Express.Multer.File,
  ): Promise<Banner> {
    const banner = await this.findOne(id);

    if (file) {
      if (banner.imageKey) {
        await this.cloudinaryService.deleteFile(banner.imageKey);
      }
      const uploaded = await this.cloudinaryService.uploadFile(
        withImageMime(file),
        'banners',
        BANNER_IMAGE_TYPES,
      );
      updateBannerDto.imageUrl = uploaded.url;
      updateBannerDto.imageKey = uploaded.key;
    }

    if (mobileFile) {
      if (banner.mobileImageKey) {
        await this.cloudinaryService.deleteFile(banner.mobileImageKey);
      }
      const uploaded = await this.cloudinaryService.uploadFile(
        withImageMime(mobileFile),
        'banners',
        BANNER_IMAGE_TYPES,
      );
      updateBannerDto.mobileImageUrl = uploaded.url;
      updateBannerDto.mobileImageKey = uploaded.key;
    }

    Object.assign(banner, updateBannerDto);
    return this.saveBanner(banner);
  }

  async remove(id: number): Promise<void> {
    const banner = await this.findOne(id);
    if (banner.imageKey) {
      await this.cloudinaryService.deleteFile(banner.imageKey);
    }
    if (banner.mobileImageKey) {
      await this.cloudinaryService.deleteFile(banner.mobileImageKey);
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

  private async saveBanner(banner: Banner): Promise<Banner> {
    try {
      return await this.bannersRepository.save(banner);
    } catch (err) {
      const detail = err instanceof QueryFailedError ? String(err.message) : '';
      if (/invalid input value for enum/i.test(detail)) {
        throw new BadRequestException(
          'Este tipo de banner no está disponible todavía. Hay que aplicar las migraciones de la API.',
        );
      }
      throw err;
    }
  }
}
