import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MineToExchangeController } from './mine-to-exchange.controller';
import { MineToExchangeService } from './mine-to-exchange.service';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenAuditModule } from '../wrap-token-audit/wrap-token-audit.module';
import { WrapTokenFeesModule } from '../wrap-token-fees/wrap-token-fees.module';
import { AggregateTransactionsModule } from '../aggregate-transactions/aggregate-transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WrapTokenTransactionEntity]),
    WrapTokenAuditModule,
    WrapTokenFeesModule,
    AggregateTransactionsModule,
  ],
  controllers: [MineToExchangeController],
  providers: [MineToExchangeService],
})
export class MineToExchangeModule {}
