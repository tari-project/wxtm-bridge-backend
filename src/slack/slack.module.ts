import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { SlackService } from './slack.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [SlackService],
  exports: [SlackService],
})
export class SlackModule {}
