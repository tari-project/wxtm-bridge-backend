import { EventBridgeEvent } from 'aws-lambda';

import { createSubgraphService } from '../helpers/createSubgraphService';

export const handler = async (event: EventBridgeEvent<any, any>) => {
  const service = await createSubgraphService();
  await service.onEventReceived(event);
};
