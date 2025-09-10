import { SubgraphClientService } from '../../src/subgraph-client/subgraph-client.service';
import { events } from './events.mock';

type SubgraphClientServiceMock = {
  [method in keyof SubgraphClientService]: jest.Mock;
};

export const SubgraphClientServiceMock = {
  getTokensUnwrappedRecords: jest.fn().mockImplementation((lastNonce) => {
    return Promise.resolve(
      events
        .filter((item) => parseInt(item.nonce) > lastNonce)
        .map((event) => ({
          subgraphId: event.subgraphId,
          nonce: parseInt(event.nonce),
          signature: event.signature,
          contractAddress: event.contract,
          from: event.from,
          targetTariAddress: event.targetTariAddress,
          amount: event.amount,
          blockHash: event.blockHash,
          blockNumber: parseInt(event.blockNumber),
          blockTimestamp: new Date(parseInt(event.blockTimestamp) * 1000),
          transactionHash: event.transactionHash,
        })),
    );
  }),
} satisfies SubgraphClientServiceMock;
