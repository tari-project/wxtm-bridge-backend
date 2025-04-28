import { SubgraphClientService } from '../../src/subgraph-client/subgraph-client.service';

type SubgraphClientServiceMock = {
  [method in keyof SubgraphClientService]: jest.Mock;
};

export const SubgraphClientServiceMock = {
  getTokensUnwrapped: jest.fn(),
} satisfies SubgraphClientServiceMock;
