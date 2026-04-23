import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
  ) {}

  async get(key: string): Promise<string | null> {
    const setting = await this.settingRepo.findOne({ where: { key } });
    return setting ? setting.value : null;
  }

  async getNumber(key: string, defaultValue: number): Promise<number> {
    const value = await this.get(key);
    if (value === null) return defaultValue;
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  async set(key: string, value: string, description?: string): Promise<Setting> {
    let setting = await this.settingRepo.findOne({ where: { key } });

    if (setting) {
      setting.value = value;
      if (description !== undefined) setting.description = description;
    } else {
      setting = this.settingRepo.create({ key, value, description: description ?? undefined });
    }

    return this.settingRepo.save(setting);
  }

  async getAll(): Promise<Setting[]> {
    return this.settingRepo.find({ order: { key: 'ASC' } });
  }

  async delete(key: string): Promise<void> {
    await this.settingRepo.delete(key);
  }
}
