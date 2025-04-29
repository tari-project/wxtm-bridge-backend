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
import { SubgraphClientServiceMock } from '../../test/mocks/subgraph.mock';
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
      SubgraphClientServiceMock.getPushNotifications.mockResolvedValueOnce([]);

      const result = await service.onEventReceived(
        {} as unknown as EventBridgeEvent<any, any>,
      );

      expect(result).toHaveLength(0);
      expect(SubgraphClientServiceMock.getPushNotifications).toHaveBeenCalled();
    });

    it('should save and read recorded tokens unwrap events', async () => {
      // This will use the default mock implementation which will return all records
      const result = await service.onEventReceived(
        {} as unknown as EventBridgeEvent<any, any>,
      );

      // Assert that the mock was called
      expect(
        SubgraphClientServiceMock.getPushNotifications,
      ).toHaveBeenCalledWith(0);

      expect(result).toHaveLength(3);
      expect(result[0].subgraphId).toEqual(2);
      expect(result[1].subgraphId).toEqual(3);
      expect(result[2].subgraphId).toEqual(4);

      // Test that the tokens were actually saved
      const data = await getRepository(TokensUnwrappedEntity).find();

      expect(data).toHaveLength(3);
      expect(data[0].subgraphId).toEqual(2);
      expect(data[2].subgraphId).toEqual(4);
    });
    it('should save new records without duplicates', async () => {
      // First insert: this should save all 3 records with IDs 2, 3, 4
      await service.onEventReceived(
        {} as unknown as EventBridgeEvent<any, any>,
      );

      // Reset the mock call count
      jest.clearAllMocks();

      // Second call should only find new records (after the last ID which should be 4 now)
      // The mock will filter and return empty array as there are no records > 4
      const result = await service.onEventReceived(
        {} as unknown as EventBridgeEvent<any, any>,
      );

      // We expect no new records since the last ID is 4 and our mock data only goes up to 4
      expect(result).toHaveLength(0);

      // Verify the correct parameter was passed (should be 4)
      expect(
        SubgraphClientServiceMock.getPushNotifications,
      ).toHaveBeenCalledWith(4);

      // Let's now add a new record with ID 5 to test actual insertion of new records
      SubgraphClientServiceMock.getPushNotifications.mockResolvedValueOnce([
        {
          subgraphId: 5,
          from: '0xaaaf0e896a78a1848e4fa25ce901108f0d61c7f3',
          targetTariAddress: '1b1F8934h12kj34j15h12k3k5j1j32h123ffaalla9442HJ',
          amount: '66600000000000000',
          blockNumber: 8173000,
          blockTimestamp: new Date(),
          transactionHash:
            '0xaaaab651962001cd8ba6f64be6c9bd1569df63f961cda1f6e4ea0c7cbb145aaa',
        },
        {
          subgraphId: 8,
          from: '0xbbbf0e896a78a1848e4fa25ce901108f0d61c7f4',
          targetTariAddress: '2v2F8934h12kj34j15h12k3k5j1j32h123ffaalla9333FF',
          amount: '88800000000000000',
          blockNumber: 8173000,
          blockTimestamp: new Date(),
          transactionHash:
            '0xccccb651962001cd8ba6f64be6c9bd1569df63f961cda1f6e4ea0c7cbb145bbb',
        },
      ]);

      // Third call should find and save only the new records with ID's 5, 6
      const result2 = await service.onEventReceived(
        {} as unknown as EventBridgeEvent<any, any>,
      );

      // Should have 1 new record
      expect(result2).toHaveLength(2);
      expect(result2[0].subgraphId).toEqual(5);
      expect(result2[1].subgraphId).toEqual(8);

      // Check all records in database - should have 5 total (2,3,4,5,8)
      const data = await getRepository(TokensUnwrappedEntity).find({
        order: { subgraphId: 'ASC' },
      });

      expect(data).toHaveLength(5);
      expect(data.map((d) => d.subgraphId)).toEqual([2, 3, 4, 5, 8]);
    });
    it('should properly handle the case where some records are already saved', async () => {
      // First save only records with IDs 2 and 3
      const initialRecords = [
        {
          subgraphId: 2,
          from: '0x226f0e896a78a1848e4fa25ce901108f0d61c7f3',
          targetTariAddress: '3a1F8934h12kj34j15h12k3k5j1j32h123ffaalla939666',
          amount: '20000000000000000',
          blockNumber: 8172949,
          blockTimestamp: new Date(),
          transactionHash:
            '0x349722eabb3e135b18882cecdc2c86f177332c4cb0503c27eb910b4a32d27a0d',
        },
        {
          subgraphId: 3,
          from: '0x226f0e896a78a1848e4fa25ce901108f0d61c7f3',
          targetTariAddress: '3a1F8934h12kj34j15h12k3k5j1j32h123ffaalla9392BC',
          amount: '10000000000000000',
          blockNumber: 8172930,
          blockTimestamp: new Date(),
          transactionHash:
            '0xe888b651962001cd8ba6f64be6c9bd1569df63f961cda1f6e4ea0c7cbb145f5c',
        },
      ];

      await getRepository(TokensUnwrappedEntity).save(initialRecords);

      // Check that we have records with IDs 2 and 3
      const initialData = await getRepository(TokensUnwrappedEntity).find();
      expect(initialData).toHaveLength(2);
      expect(initialData.map((d) => d.subgraphId)).toEqual([2, 3]);

      // Now run the service - it should only fetch and save record with ID 4
      const result = await service.onEventReceived(
        {} as unknown as EventBridgeEvent<any, any>,
      );

      // Should only return 1 record (ID 4)
      expect(result).toHaveLength(1);
      expect(result[0].subgraphId).toEqual(4);

      // Verify the correct parameter was passed (should be 3)
      expect(
        SubgraphClientServiceMock.getPushNotifications,
      ).toHaveBeenCalledWith(3);

      // Check the final state - should have all 3 records
      const finalData = await getRepository(TokensUnwrappedEntity).find({
        order: { subgraphId: 'ASC' },
      });

      expect(finalData).toHaveLength(3);
      expect(finalData.map((d) => d.subgraphId)).toEqual([2, 3, 4]);
    });
  });
});
