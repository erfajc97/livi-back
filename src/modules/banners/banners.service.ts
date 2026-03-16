import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './entities/banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private bannersRepository: Repository<Banner>,
  ) {}

  async create(createBannerDto: CreateBannerDto): Promise<Banner> {
    const banner = this.bannersRepository.create(createBannerDto);
    return this.bannersRepository.save(banner);
  }

  async findAll(): Promise<Banner[]> {
    return this.bannersRepository.find({
      order: { position: 'ASC', createdAt: 'DESC' },
    });
  }

  async findVisible(): Promise<Banner[]> {
    return this.bannersRepository.find({
      where: { isVisible: true },
      order: { position: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Banner> {
    const banner = await this.bannersRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }
    return banner;
  }

  async update(id: number, updateBannerDto: UpdateBannerDto): Promise<Banner> {
    const banner = await this.findOne(id);
    Object.assign(banner, updateBannerDto);
    return this.bannersRepository.save(banner);
  }

  async remove(id: number): Promise<void> {
    const banner = await this.findOne(id);
    await this.bannersRepository.remove(banner);
  }

  async count(): Promise<number> {
    return this.bannersRepository.count();
  }

  async countVisible(): Promise<number> {
    return this.bannersRepository.count({ where: { isVisible: true } });
  }
}
