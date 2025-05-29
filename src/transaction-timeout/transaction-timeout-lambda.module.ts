import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import config from '../config/config';
import { DatabaseModule } from '../database/database.module';
import { TransactionTimeoutModule } from './transaction-timeout.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    DatabaseModule,
    TransactionTimeoutModule,
  ],
})
export class TransactionTimeoutLambdaModule {}
