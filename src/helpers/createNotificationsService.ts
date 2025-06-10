import { NestFactory } from '@nestjs/core';

import { NotificationsLambdaModule } from '../notifications/notifications-lambda.module';
import { NotificationsService } from '../notifications/notifications.service';

let service: NotificationsService | undefined;

export const createNotificationsService =
  async (): Promise<NotificationsService> => {
    if (!service) {
      const appContext = await NestFactory.createApplicationContext(
        NotificationsLambdaModule,
        {
          abortOnError: true,
        },
      );
      service = appContext.get<NotificationsService>(NotificationsService);
    }

    return service;
  };
