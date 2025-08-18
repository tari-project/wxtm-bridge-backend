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
        { toString: () => '123456789' }, // uint256 nonce
      ],
    ];

    jest
      .spyOn(ethers.utils.AbiCoder.prototype, 'decode')
      .mockReturnValue(mockDecodedData);

    const mockResponse = {
      pushNotifications: [
        {
          id: '1',
          signature: 'TokensUnwrapped',
          contract: '0xcontract1',
          timestamp: blockTimestampSeconds.toString(),
          blockHash: '0xblockhash1',
          blockNumber: '12345678',
          transactionHash: '0xhash1',
          logIndex: '0',
          seqNumber: '42',
          transactionData: '0xabcdef1234567890',
        },
      ],
    };

    (graphqlRequest.request as jest.Mock).mockResolvedValueOnce(mockResponse);

    const subgraphUrl = config().subgraph.url;

    const result = await service.getPushNotifications(10);

    expect(graphqlRequest.request).toHaveBeenCalledWith(
      subgraphUrl,
      expect.stringContaining('pushNotifications'),
    );

    expect(graphqlRequest.request).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('seqNumber_gt: 10'),
    );

    expect(result).toEqual([
      {
        subgraphId: 42,
        from: '0xuser1',
        targetTariAddress: 'tariAddress1',
        amount: '1000000000000000000',
        nonce: '123456789',
        blockNumber: 12345678,
        blockTimestamp: new Date(blockTimestampSeconds * 1000),
        transactionHash: '0xhash1',
      },
    ]);
  });
});
