import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WrapTokenProcessingService } from './wrap-token-processing.service';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenAuditModule } from '../wrap-token-audit/wrap-token-audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WrapTokenTransactionEntity]),
    WrapTokenAuditModule,
  ],
  providers: [WrapTokenProcessingService],
  exports: [WrapTokenProcessingService],
})
export class WrapTokenProcessingModule {}
