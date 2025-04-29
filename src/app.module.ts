import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import config from './config/config';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { WrapTokenTransactionModule } from './wrap-token-transaction/wrap-token-transaction.module';
import { TokensUnwrappedModule } from './tokens-unwrapped/tokens-unwrapped.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
    WrapTokenTransactionModule,
    TokensUnwrappedModule,
  ],
})
export class AppModule {}
