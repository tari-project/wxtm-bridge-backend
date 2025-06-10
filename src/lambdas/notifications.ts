import { SNSEvent } from 'aws-lambda';

import { createNotificationsService } from '../helpers/createNotificationsService';

export const handler = async (event: SNSEvent) => {
  const service = await createNotificationsService();
  await service.onEventReceived(event);
};
