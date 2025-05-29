import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionTimeoutService } from './transaction-timeout.service';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WrapTokenTransactionEntity])],
  providers: [TransactionTimeoutService],
  exports: [TransactionTimeoutService],
})
export class TransactionTimeoutModule {}
