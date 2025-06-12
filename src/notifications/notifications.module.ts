import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SNSClient } from '@aws-sdk/client-sns';

import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { IConfig } from '../config/config.interface';
import { SlackModule } from '../slack/slack.module';

@Module({
  imports: [ConfigModule, SlackModule],
  controllers: [NotificationsController],
  providers: [
    {
      provide: SNSClient,
      useFactory: (configService: ConfigService<IConfig, true>) => {
        return new SNSClient({
          region: configService.get('aws.region', { infer: true }),
        });
      },
      inject: [ConfigService],
    },
    NotificationsService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
