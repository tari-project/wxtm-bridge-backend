import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import config from './config/config';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { WrapTokenTransactionModule } from './wrap-token-transaction/wrap-token-transaction.module';
import { TokensUnwrappedModule } from './tokens-unwrapped/tokens-unwrapped.module';
import { WrapTokenModule } from './wrap-token/wrap-token.module';
import { WrapTokenFeesModule } from './wrap-token-fees/wrap-token-fees.module';
import { SafeApiModule } from './safe-api/safe-api.module';
import { WrapTokenTransactionM2MModule } from './wrap-token-transaction-m2m/wrap-token-transaction-m2m.module';
import { M2MAuthModule } from './m2m-auth/m2m-auth.module';
import { WrapTokenAuditModule } from './wrap-token-audit/wrap-token-audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    M2MAuthModule.forRoot(),
    DatabaseModule,
    UserModule,
    AuthModule,
    WrapTokenModule,
    WrapTokenTransactionModule,
    WrapTokenTransactionM2MModule,
    TokensUnwrappedModule,
    WrapTokenFeesModule,
    SafeApiModule,
    WrapTokenAuditModule,
  ],
})
export class AppModule {}
