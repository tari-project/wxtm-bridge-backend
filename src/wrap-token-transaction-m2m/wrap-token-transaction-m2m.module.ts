import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WrapTokenTransactionM2MService } from './wrap-token-transaction-m2m.service';
import { WrapTokenTransactionM2MController } from './wrap-token-transaction-m2m.controller';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WrapTokenTransactionEntity])],
  providers: [WrapTokenTransactionM2MService],
  controllers: [WrapTokenTransactionM2MController],
})
export class WrapTokenTransactionM2MModule {}
