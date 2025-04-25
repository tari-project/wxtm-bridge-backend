import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EventBridgeEvent } from 'aws-lambda';

import config from '../config/config';
import {
  TestDatabaseModule,
  initializeDatabase,
  clearDatabase,
} from '../../test/database';
import { Factory, getFactory } from '../../test/factory/factory';
import { SubgraphModule } from './subgraph.module';
import { SubgraphService } from './subgraph.service';
import { SubgraphClientService } from '../subgraph-client/subgraph-client.service';
import { SubgraphClientServiceMock } from '../../test/mocks/subgraph-client.mock';

describe('SubgraphService tests', () => {
  let module: TestingModule;
  let service: SubgraphService;
  let factory: Factory;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [config], isGlobal: true }),
        TestDatabaseModule,
        SubgraphModule,
      ],
    })
      .overrideProvider(SubgraphClientService)
      .useValue(SubgraphClientServiceMock)
      .compile();

    service = module.get(SubgraphService);

    await initializeDatabase();
    factory = await getFactory();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await clearDatabase();
  });

  afterAll(async () => {
    await module.close();
  });

  describe('onEventReceived', () => {
    it('should handle empty tokens list', async () => {
      // Mock empty result
      SubgraphClientServiceMock.getTokensUnwrapped.mockResolvedValue([]);

      const result = await service.onEventReceived(
        {} as unknown as EventBridgeEvent<any, any>,
      );

      expect(result).toHaveLength(0);
      expect(SubgraphClientServiceMock.getTokensUnwrapped).toHaveBeenCalled();
    });

    it('should save and read recorded tokens unwrap events', async () => {
      const mockTokensUnwrapped = [
        {
          id: 1,
          from: '0xuser1',
          targetTariAddress: 'tariAddress1',
          amount: '1000000000000000000',
          blockNumber: 12345678,
          blockTimestamp: new Date(),
          transactionHash: '0xhash1',
        },
        {
          id: 2,
          from: '0xuser2',
          targetTariAddress: 'tariAddress2',
          amount: '2000000000000000000',
          blockNumber: 12345679,
          blockTimestamp: new Date(),
          transactionHash: '0xhash2',
        },
      ];

      // Set the mock to return prepared data
      SubgraphClientServiceMock.getTokensUnwrapped.mockResolvedValue(
        mockTokensUnwrapped,
      );

      const result = await service.onEventReceived(
        {} as unknown as EventBridgeEvent<any, any>,
      );

      // Assert that the mock was called
      expect(SubgraphClientServiceMock.getTokensUnwrapped).toHaveBeenCalled();

      expect(result).toHaveLength(2);
      expect(result[0].id).toEqual(1);
      expect(result[1].id).toEqual(2);

      // Test that the tokens were actually saved
      const savedTokens = await module
        .get('TokensUnwrappedEntityRepository')
        .find();
      expect(savedTokens).toHaveLength(2);
      expect(savedTokens[0].id).toEqual(1);
    });
  });
});
