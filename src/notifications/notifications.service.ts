import { Injectable, Logger } from '@nestjs/common';
import { SNSEvent } from 'aws-lambda';
import { ConfigService } from '@nestjs/config';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

import { IConfig } from '../config/config.interface';
import { SuccessDTO } from '../dto/success.dto';
import { NotificationDTO } from './notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly topicArn: string;

  constructor(
    private readonly configService: ConfigService<IConfig, true>,
    private readonly snsClient: SNSClient,
  ) {
    this.topicArn = this.configService.get('aws.notificationsTopicArn', {
      infer: true,
    });
  }

  async onEventReceived(event: SNSEvent): Promise<void> {
    for (const record of event.Records) {
      const notification: NotificationDTO = JSON.parse(record.Sns.Message);
      await this.processNotification(notification);
    }
  }

  private async processNotification(
    notification: NotificationDTO,
  ): Promise<void> {
    this.logger.log(
      `Notification message: ${notification.message} and origin: ${notification.origin}`,
    );
  }

  async emitNotification(notification: NotificationDTO): Promise<SuccessDTO> {
    const command = new PublishCommand({
      TopicArn: this.topicArn,
      Message: JSON.stringify(notification),
    });

    await this.snsClient.send(command);

    return {
      success: true,
    };
  }
}
