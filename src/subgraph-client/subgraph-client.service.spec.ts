import * as graphqlRequest from 'graphql-request';
import config from '../config/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { SubgraphClientService } from './subgraph-client.service';
import { ethers } from 'ethers';

jest.mock('graphql-request', () => ({
  gql: jest.fn((strings: TemplateStringsArray, ...values: any[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
  ),
  request: jest.fn(),
}));

describe('SubgraphClientService', () => {
  let service: SubgraphClientService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [config], isGlobal: true })],
      providers: [SubgraphClientService],
    }).compile();

    service = module.get<SubgraphClientService>(SubgraphClientService);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should retrieve push notifications data', async () => {
    const blockTimestampSeconds = Math.floor(Date.now() / 1000);

    const mockDecodedData = [
      [
        ['0xuser1', 'tariAddress1'], // tuple(address,string)
        { toString: () => '1000000000000000000' }, // uint256 amount
      ],
    ];

    jest
      .spyOn(ethers.utils.AbiCoder.prototype, 'decode')
      .mockReturnValue(mockDecodedData);

    const mockResponse = {
      tokensUnwrappedRecords: [
        {
          id: '0x0b3517c2ea73a13072aaa893aa07f0a1083726a43e58f625d7d2451c9d75cab5-43-1',
          nonce: '42',
          signature: 'TokensUnwrapped',
          contract: '0xcontract1',
          timestamp: blockTimestampSeconds.toString(),
          blockHash: '0xblockhash1',
          blockNumber: '12345678',
          transactionHash: '0xhash1',
          logIndex: '0',
          transactionData: '0xabcdef1234567890',
        },
      ],
    };

    (graphqlRequest.request as jest.Mock).mockResolvedValueOnce(mockResponse);

    const subgraphUrl = config().subgraph.url;

    const result = await service.getTokensUnwrappedRecords(10);

    expect(graphqlRequest.request).toHaveBeenCalledWith(
      subgraphUrl,
      expect.stringContaining('tokensUnwrappedRecords'),
    );

    expect(graphqlRequest.request).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('nonce_gt: 10'),
    );

    expect(result).toEqual([
      {
        subgraphId:
          '0x0b3517c2ea73a13072aaa893aa07f0a1083726a43e58f625d7d2451c9d75cab5-43-1',
        nonce: 42,
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
