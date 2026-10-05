import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Banner, BannerType, type BannerMediaType } from './entities/banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { CloudinaryService } from '../../common/services/cloudinary.service';

const BANNER_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

/**
 * La portada de la home puede ser un video. Se aceptan los formatos que
 * reproduce un navegador sin transcodificar (mp4/webm) más quicktime, que es
 * lo que sale de un iPhone.
 */
const BANNER_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

/** Lo permitido en el campo principal (`image`): imagen o video. */
const BANNER_MEDIA_TYPES = [...BANNER_IMAGE_TYPES, ...BANNER_VIDEO_TYPES];

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
};

/**
 * ChatGPT y algunos SO mandan image/webp (o un .mp4) como octet-stream: se
 * recupera el mimetype real desde la extensión antes de validar.
 */
function withNormalizedMime(file: Express.Multer.File): Express.Multer.File {
  if (BANNER_MEDIA_TYPES.includes(file.mimetype)) return file;
  const ext = file.originalname.split('.').pop()?.toLowerCase() ?? '';
  const mime = EXT_TO_MIME[ext];
  if (mime) file.mimetype = mime;
  return file;
}

const mediaTypeOf = (file: Express.Multer.File): BannerMediaType =>
  file.mimetype?.startsWith('video/') ? 'video' : 'image';

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
      const media = withNormalizedMime(file);
      const uploaded = await this.cloudinaryService.uploadFile(
        media,
        'banners',
        BANNER_MEDIA_TYPES,
      );
      createBannerDto.imageUrl = uploaded.url;
      createBannerDto.imageKey = uploaded.key;
      createBannerDto.mediaType = mediaTypeOf(media);
    }
    // El arte móvil es siempre imagen: además de la versión vertical, hace de
    // `poster` cuando la portada es un video.
    if (mobileFile) {
      const uploaded = await this.cloudinaryService.uploadFile(
        withNormalizedMime(mobileFile),
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
      const media = withNormalizedMime(file);
      const uploaded = await this.cloudinaryService.uploadFile(
        media,
        'banners',
        BANNER_MEDIA_TYPES,
      );
      updateBannerDto.imageUrl = uploaded.url;
      updateBannerDto.imageKey = uploaded.key;
      updateBannerDto.mediaType = mediaTypeOf(media);
    }

    if (mobileFile) {
      if (banner.mobileImageKey) {
        await this.cloudinaryService.deleteFile(banner.mobileImageKey);
      }
      const uploaded = await this.cloudinaryService.uploadFile(
        withNormalizedMime(mobileFile),
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
