import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import config from '../config/config';
import { NotificationsModule } from './notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    NotificationsModule,
  ],
})
export class NotificationsLambdaModule {}
