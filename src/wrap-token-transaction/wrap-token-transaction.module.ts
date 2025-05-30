import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { WrapTokenTransactionService } from './wrap-token-transaction.service';
import { WrapTokenTransactionEntity } from './wrap-token-transaction.entity';
import { WrapTokenTransactionController } from './wrap-token-transaction.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WrapTokenTransactionEntity]), AuthModule],
  providers: [WrapTokenTransactionService],
  controllers: [WrapTokenTransactionController],
})
export class WrapTokenTransactionModule {}
