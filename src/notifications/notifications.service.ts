import { Injectable, Logger } from '@nestjs/common';
import { SNSEvent } from 'aws-lambda';
import { ConfigService } from '@nestjs/config';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

import { IConfig } from '../config/config.interface';
import { SuccessDTO } from '../dto/success.dto';
import { NotificationDTO } from './notifications.dto';
import { SlackService } from '../slack/slack.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly topicArn: string;

  constructor(
    private readonly configService: ConfigService<IConfig, true>,
    private readonly snsClient: SNSClient,
    private readonly slackService: SlackService,
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

    await this.slackService.sendMessage(notification.message);
  }

  async sendMintHighTransactionNotification(
    safeTxHash: string,
  ): Promise<SuccessDTO> {
    const domain = this.configService.get('domain', {
      infer: true,
    });

    const tags = this.configService.get('slack.tags', {
      infer: true,
    });

    await this.emitNotification({
      message: `${tags} mint high transaction awaiting approval: https://admin.${domain}/safe-transactions/show/${safeTxHash}`,
      origin: 'Processor',
    });

    return {
      success: true,
    };
  }

  async emitNotification(notification: NotificationDTO): Promise<void> {
    const command = new PublishCommand({
      TopicArn: this.topicArn,
      Message: JSON.stringify(notification),
    });

    await this.snsClient.send(command);
  }

  async sendTransactionUnprocessableNotification(
    transactionId: number,
  ): Promise<SuccessDTO> {
    const domain = this.configService.get('domain', {
      infer: true,
    });

    await this.emitNotification({
      message: `Transaction unprocessible: https://admin.${domain}/wrap-token-transactions/edit/${transactionId}`,
      origin: 'Processor',
    });

    return {
      success: true,
    };
  }
}
