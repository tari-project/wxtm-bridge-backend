import { Injectable, Logger } from '@nestjs/common';
import { SNSEvent } from 'aws-lambda';

import { NotificationDTO } from './notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async onEventReceived(event: SNSEvent): Promise<void> {
    this.logger.log('Received notification event');

    for (const record of event.Records) {
      const payload: NotificationDTO = JSON.parse(record.Sns.Message);

      await this.processNotification(payload);
    }
  }

  private async processNotification(payload: NotificationDTO): Promise<void> {
    this.logger.log(`Notification message processed: ${payload.message}`);
  }
}
