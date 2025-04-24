import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import * as graphqlRequest from 'graphql-request';
import config from '../config/config';
import { SubgraphClientService } from './subgraph-client.service';

jest.mock('graphql-request', () => ({
  gql: jest.fn((...args) => args[0]),
  request: jest.fn(),
}));

describe('SubgraphClientService', () => {
  let service: SubgraphClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [config], isGlobal: true })],
      providers: [SubgraphClientService],
    }).compile();

    service = module.get<SubgraphClientService>(SubgraphClientService);
    jest.clearAllMocks();
  });

  it('should retrieve tokens unwrapped data', async () => {
    const mockResponse = {
      tokensUnwrappeds: [
        {
          id: 'token1',
          from: '0xuser1',
          targetTariAddress: 'tariAddress1',
          amount: '1000000000000000000',
          blockNumber: '12345678',
          blockTimestamp: '1618282828',
          transactionHash: '0xhash1',
        },
      ],
    };

    (graphqlRequest.request as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await service.getTokensUnwrapped();

    expect(graphqlRequest.request).toHaveBeenCalled();
    expect(result).toEqual(mockResponse.tokensUnwrappeds);
  });
});
