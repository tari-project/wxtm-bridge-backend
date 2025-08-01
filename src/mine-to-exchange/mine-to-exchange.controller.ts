import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { MineToExchangeService } from './mine-to-exchange.service';
import {
  MineToExchangeConfigDTO,
  MineToExchangeConfigRespDTO,
  CreateMiningTransactionsDTO,
} from './mine-to-exchange.dto';
import { M2MAuthGuard } from '../m2m-auth/m2m-auth.guard';
import { SuccessDTO } from '../dto/success.dto';

@ApiTags('mine-to-exchange')
@Controller('mine-to-exchange')
export class MineToExchangeController {
  constructor(private readonly service: MineToExchangeService) {}

  @Post('config')
  config(
    @Body() dto: MineToExchangeConfigDTO,
  ): Promise<MineToExchangeConfigRespDTO> {
    return this.service.getConfig(dto.toAddress);
  }

  @Post('transactions')
  @M2MAuthGuard({
    description: 'Create mining transactions',
  })
  createMiningTransactions(
    @Body() dto: CreateMiningTransactionsDTO,
  ): Promise<SuccessDTO> {
    return this.service.createMiningTransactions(dto.transactions);
  }
}
