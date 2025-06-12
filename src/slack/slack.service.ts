import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { IConfig } from '../config/config.interface';

@Injectable()
export class SlackService {
  private readonly slackWebhookUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<IConfig, true>,
  ) {
    this.slackWebhookUrl = this.configService.get('slack.webhookUrl', {
      infer: true,
    });
  }

  async sendMessage(message: string): Promise<void> {
    await firstValueFrom(
      this.httpService.post(this.slackWebhookUrl, {
        text: message,
      }),
    );
  }
}
