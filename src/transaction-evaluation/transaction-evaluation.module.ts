import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionEvaluationService } from './transaction-evaluation.service';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WrapTokenTransactionEntity]),
    NotificationsModule,
  ],
  providers: [TransactionEvaluationService],
  exports: [TransactionEvaluationService],
})
export class TransactionEvaluationModule {}
