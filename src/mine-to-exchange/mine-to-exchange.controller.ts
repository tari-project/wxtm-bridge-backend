import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { MineToExchangeService } from './mine-to-exchange.service';
import {
  MineToExchangeConfigDTO,
  MineToExchangeConfigRespDTO,
} from './mine-to-exchange.dto';

@ApiTags('mine-to-exchange')
@Controller('mine-to-exchange')
export class MineToExchangeController {
  constructor(private readonly service: MineToExchangeService) {}

  @Post('config')
  async config(
    @Body() dto: MineToExchangeConfigDTO,
  ): Promise<MineToExchangeConfigRespDTO> {
    return this.service.getConfig(dto.toAddress);
  }
}
