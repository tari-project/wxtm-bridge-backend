import { SubgraphClientService } from '../../src/subgraph-client/subgraph-client.service';
import { events } from './events.mock';

type SubgraphClientServiceMock = {
  [method in keyof SubgraphClientService]: jest.Mock;
};

export const SubgraphClientServiceMock = {
  getTokensUnwrappedRecords: jest.fn().mockImplementation((lastNonce) => {
    return Promise.resolve(
      events.filter((item) => parseInt(item.nonce) > lastNonce),
    );
  }),
} satisfies SubgraphClientServiceMock;
