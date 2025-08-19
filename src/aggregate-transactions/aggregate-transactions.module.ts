import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenAuditModule } from '../wrap-token-audit/wrap-token-audit.module';
import { WrapTokenFeesModule } from '../wrap-token-fees/wrap-token-fees.module';
import { AggregateTransactionsService } from './aggregate-transactions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WrapTokenTransactionEntity]),
    WrapTokenAuditModule,
    WrapTokenFeesModule,
  ],
  providers: [AggregateTransactionsService],
  exports: [AggregateTransactionsService],
})
export class AggregateTransactionsModule {}
