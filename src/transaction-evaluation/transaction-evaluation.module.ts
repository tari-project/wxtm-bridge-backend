import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionEvaluationService } from './transaction-evaluation.service';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WrapTokenTransactionEntity,
      TokensUnwrappedEntity,
    ]),
    NotificationsModule,
  ],
  providers: [TransactionEvaluationService],
  exports: [TransactionEvaluationService],
})
export class TransactionEvaluationModule {}
