import { SubgraphClientService } from '../../src/subgraph-client/subgraph-client.service';
import { events } from './events.mock';

type SubgraphClientServiceMock = {
  [method in keyof SubgraphClientService]: jest.Mock;
};

export const SubgraphClientServiceMock = {
  getTokensUnwrapped: jest.fn().mockResolvedValue([]),

  getPushNotifications: jest.fn().mockImplementation((lastSubgraphId) => {
    // Filter by subgraphId - only return records with ID > lastSubgraphId
    return Promise.resolve(
      events.filter((item) => item.subgraphId > lastSubgraphId),
    );
  }),
} satisfies SubgraphClientServiceMock;
