import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WrapTokenController } from './wrap-token.controller';
import { WrapTokenService } from './wrap-token.service';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { TokenFeesModule } from '../token-fees/token-fees.module';
import { WrapTokenAuditModule } from '../wrap-token-audit/wrap-token-audit.module';
import { SettingsEntity } from '../settings/settings.entity';
import { WrapTokenTransactionM2MModule } from '../wrap-token-transaction-m2m/wrap-token-transaction-m2m.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WrapTokenTransactionEntity, SettingsEntity]),
    WrapTokenAuditModule,
    TokenFeesModule,
    WrapTokenTransactionM2MModule,
  ],
  providers: [WrapTokenService],
  controllers: [WrapTokenController],
})
export class WrapTokenModule {}
