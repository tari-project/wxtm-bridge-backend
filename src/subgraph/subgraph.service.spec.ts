import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EventBridgeEvent } from 'aws-lambda';

import config from '../config/config';
import {
  TestDatabaseModule,
  initializeDatabase,
  clearDatabase,
  getRepository,
} from '../../test/database';
import { SubgraphModule } from './subgraph.module';
import { SubgraphService } from './subgraph.service';
import { SubgraphClientService } from '../subgraph-client/subgraph-client.service';
import { SubgraphClientServiceMock } from '../../test/mocks/subgraph-client.mock';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';

describe('SubgraphService tests', () => {
  let module: TestingModule;
  let service: SubgraphService;

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
          subgraphId: 1,
          from: '0x226f0e896a78a1848e4fa25ce901108f0d61c7f3',
          targetTariAddress: '3a1F8934h12kj34j15h12k3k5j1j32h123ffaalla939666',
          amount: '20000000000000000',
          blockNumber: 8172949,
          blockTimestamp: new Date(),
          transactionHash:
            '0x349722eabb3e135b18882cecdc2c86f177332c4cb0503c27eb910b4a32d27a0d',
        },
        {
          subgraphId: 2,
          from: '0x226f0e896a78a1848e4fa25ce901108f0d61c7f3',
          targetTariAddress: '3a1F8934h12kj34j15h12k3k5j1j32h123ffaalla9392BC',
          amount: '10000000000000000',
          blockNumber: 8172930,
          blockTimestamp: new Date(),
          transactionHash:
            '0xe888b651962001cd8ba6f64be6c9bd1569df63f961cda1f6e4ea0c7cbb145f5c',
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
      expect(result[0].subgraphId).toEqual(1);
      expect(result[1].subgraphId).toEqual(2);

      // Test that the tokens were actually saved
      const data = await getRepository(TokensUnwrappedEntity).find();

      expect(data).toHaveLength(2);
      expect(data[0].subgraphId).toEqual(1);
    });
  });
});
