import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WrapTokenController } from './wrap-token.controller';
import { WrapTokenService } from './wrap-token.service';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { TokenFeesModule } from '../token-fees/token-fees.module';
import { WrapTokenAuditModule } from '../wrap-token-audit/wrap-token-audit.module';
import { SettingsEntity } from '../settings/settings.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WrapTokenTransactionEntity, SettingsEntity]),
    WrapTokenAuditModule,
    TokenFeesModule,
  ],
  providers: [WrapTokenService],
  controllers: [WrapTokenController],
})
export class WrapTokenModule {}
