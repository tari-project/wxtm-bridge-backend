import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WrapTokenTransactionM2MService } from './wrap-token-transaction-m2m.service';
import { WrapTokenTransactionM2MController } from './wrap-token-transaction-m2m.controller';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenAuditModule } from '../wrap-token-audit/wrap-token-audit.module';
import { TransactionEvaluationModule } from '../transaction-evaluation/transaction-evaluation.module';
import { WrapTokenProcessingModule } from '../wrap-token-processing/wrap-token-processing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WrapTokenTransactionEntity]),
    WrapTokenAuditModule,
    TransactionEvaluationModule,
    WrapTokenProcessingModule,
  ],
  providers: [WrapTokenTransactionM2MService],
  controllers: [WrapTokenTransactionM2MController],
})
export class WrapTokenTransactionM2MModule {}
