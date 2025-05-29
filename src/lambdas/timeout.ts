import { EventBridgeEvent } from 'aws-lambda';

import { createTransactionTimeoutService } from '../helpers/createTransactionTimeoutService';

export const handler = async (event: EventBridgeEvent<any, any>) => {
  const service = await createTransactionTimeoutService();
  await service.onEventReceived(event);
};
