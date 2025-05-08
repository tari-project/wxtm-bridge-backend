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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
    WrapTokenModule,
    WrapTokenTransactionModule,
    TokensUnwrappedModule,
    WrapTokenFeesModule,
    SafeApiModule,
  ],
})
export class AppModule {}
