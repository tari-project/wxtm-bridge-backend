import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WrapTokenController } from './wrap-token.controller';
import { WrapTokenService } from './wrap-token.service';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WrapTokenTransactionEntity])],
  providers: [WrapTokenService],
  controllers: [WrapTokenController],
})
export class WrapTokenModule {}
