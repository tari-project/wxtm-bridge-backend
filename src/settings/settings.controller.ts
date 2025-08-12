import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AdminGuard } from '../auth/auth.admin.guard';
import { AdminOrM2MAuthGuard } from '../auth/auth.admin-or-m2m.guard';
import { SettingsService } from './settings.service';
import { SettingsEntity } from './settings.entity';
import { UpdateSettingReqDTO } from './settings.dto';
import { SuccessDTO } from '../dto/success.dto';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private service: SettingsService) {}

  @Get()
  @AdminOrM2MAuthGuard({
    description: 'Get application settings',
  })
  async getSettings(): Promise<SettingsEntity> {
    return this.service.getSettings();
  }

  @Put()
  @AdminGuard({ description: 'Update application settings' })
  async updateSettings(@Body() dto: UpdateSettingReqDTO): Promise<SuccessDTO> {
    return this.service.updateSettings(dto);
  }
}
