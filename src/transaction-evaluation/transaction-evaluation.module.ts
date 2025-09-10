import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionEvaluationService } from './transaction-evaluation.service';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { TokensUnwrappedAuditModule } from '../tokens-unwrapped-audit/tokens-unwrapped-audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WrapTokenTransactionEntity,
      TokensUnwrappedEntity,
    ]),
    TokensUnwrappedAuditModule,
    NotificationsModule,
  ],
  providers: [TransactionEvaluationService],
  exports: [TransactionEvaluationService],
})
export class TransactionEvaluationModule {}
