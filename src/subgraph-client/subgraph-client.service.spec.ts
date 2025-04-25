import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as graphqlRequest from 'graphql-request';
import config from '../config/config';
import { SubgraphClientService } from './subgraph-client.service';
import { IConfig } from '../config/config.interface';

jest.mock('graphql-request', () => ({
  // gql: jest.fn((...args) => args[0]), // => below is changing array into string
  gql: jest.fn((strings: TemplateStringsArray, ...values: any[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
  ),
  request: jest.fn(),
}));

describe('SubgraphClientService', () => {
  let service: SubgraphClientService;
  let module: TestingModule;
  let configService: ConfigService<IConfig, true>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [config], isGlobal: true })],
      providers: [SubgraphClientService],
    }).compile();

    service = module.get<SubgraphClientService>(SubgraphClientService);
    configService = module.get<ConfigService<IConfig, true>>(ConfigService);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should retrieve tokens unwrapped data', async () => {
    const blockTimestampSeconds = Math.floor(Date.now() / 1000);
    const mockResponse = {
      tokensUnwrappeds: [
        {
          id: 6,
          from: '0xuser1',
          targetTariAddress: 'tariAddress1',
          amount: '1000000000000000000',
          blockNumber: 12345678,
          blockTimestamp: blockTimestampSeconds.toString(),
          transactionHash: '0xhash1',
        },
      ],
    };

    (graphqlRequest.request as jest.Mock).mockResolvedValueOnce(mockResponse);

    // Get the actual URL from config
    const subgraphUrl = config().subgraph.url;

    const result = await service.getTokensUnwrapped();

    expect(graphqlRequest.request).toHaveBeenCalledWith(
      subgraphUrl,
      expect.stringContaining('tokensUnwrappeds'),
    );
    expect(result).toEqual([
      {
        subgraphId: 6,
        from: '0xuser1',
        targetTariAddress: 'tariAddress1',
        amount: '1000000000000000000',
        blockNumber: 12345678,
        blockTimestamp: new Date(blockTimestampSeconds * 1000),
        transactionHash: '0xhash1',
      },
    ]);
  });
});
