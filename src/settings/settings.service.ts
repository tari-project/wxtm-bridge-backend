import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SettingsEntity } from './settings.entity';
import { UpdateSettingReqDTO } from './settings.dto';
import { SuccessDTO } from '../dto/success.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SettingsEntity)
    private settingsRepository: Repository<SettingsEntity>,
  ) {}

  async getSettings(): Promise<SettingsEntity> {
    const settings = await this.settingsRepository.findOneBy({ id: 1 });

    if (!settings) {
      throw new NotFoundException('Settings not found');
    }

    return settings;
  }

  async updateSettings({
    wrapTokensServiceStatus,
  }: UpdateSettingReqDTO): Promise<SuccessDTO> {
    const settings = await this.getSettings();

    await this.settingsRepository.update(settings.id, {
      wrapTokensServiceStatus,
    });

    return { success: true };
  }
}
