import { Module } from '@nestjs/common';

import { MineToExchangeController } from './mine-to-exchange.controller';
import { MineToExchangeService } from './mine-to-exchange.service';

@Module({
  controllers: [MineToExchangeController],
  providers: [MineToExchangeService],
})
export class MineToExchangeModule {}
