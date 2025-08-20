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
import { Factory, getFactory } from '../../test/factory/factory';
import { SubgraphModule } from './subgraph.module';
import { SubgraphService } from './subgraph.service';
import { SubgraphClientService } from '../subgraph-client/subgraph-client.service';
import { SubgraphClientServiceMock } from '../../test/mocks/subgraph.mock';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { TokensUnwrappedStatus } from '../tokens-unwrapped/tokens-unwrapped.const';

describe('SubgraphService tests', () => {
  let factory: Factory;
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
      SubgraphClientServiceMock.getTokensUnwrappedRecords.mockResolvedValueOnce(
        [],
      );

      const result = await service.onEventReceived(
        {} as unknown as EventBridgeEvent<any, any>,
      );

      expect(result).toHaveLength(0);
      expect(
        SubgraphClientServiceMock.getTokensUnwrappedRecords,
      ).toHaveBeenCalled();
    });

    it('should save and read recorded tokens unwrap events', async () => {
      const result = await service.onEventReceived(
        {} as unknown as EventBridgeEvent<any, any>,
      );

      expect(
        SubgraphClientServiceMock.getTokensUnwrappedRecords,
      ).toHaveBeenCalledWith(-1);

      expect(result).toHaveLength(3);

      expect(result[0].nonce).toEqual('2');
      expect(result[1].nonce).toEqual('3');
      expect(result[2].nonce).toEqual('4');

      const data = await getRepository(TokensUnwrappedEntity).find();

      expect(data).toHaveLength(3);
      expect(data[0].subgraphId).toEqual(
        '0x0b3517c2ea73a13072aaa893aa07f0a1083726a43e58f625d7d2451c9d75cab5-43-2',
      );
      expect(data[0].nonce).toEqual(2);
      expect(data[0].status).toEqual(TokensUnwrappedStatus.CREATED);
      expect(data[2].nonce).toEqual(4);
      expect(data[2].status).toEqual(TokensUnwrappedStatus.CREATED);
    });
    it('should save new records without duplicates', async () => {
      await factory.create(TokensUnwrappedEntity.name, { nonce: 2 });
      await factory.create(TokensUnwrappedEntity.name, { nonce: 3 });
      await factory.create(TokensUnwrappedEntity.name, { nonce: 4 });

      const result = await service.onEventReceived(
        {} as unknown as EventBridgeEvent<any, any>,
      );

      expect(result).toHaveLength(0);

      expect(
        SubgraphClientServiceMock.getTokensUnwrappedRecords,
      ).toHaveBeenCalledWith(4);

      SubgraphClientServiceMock.getTokensUnwrappedRecords.mockResolvedValueOnce(
        [
          {
            subgraphId:
              '0x0b3517c2ea73a13072aaa893aa07f0a1083726a43e58f625d7d2451c9d75cab5-43-5',
            nonce: '5',
            from: '0xaaaf0e896a78a1848e4fa25ce901108f0d61c7f3',
            targetTariAddress:
              '1b1F8934h12kj34j15h12k3k5j1j32h123ffaalla9442HJ',
            amount: '66600000000000000',
            blockNumber: 8173000,
            blockTimestamp: new Date(),
            transactionHash:
              '0xaaaab651962001cd8ba6f64be6c9bd1569df63f961cda1f6e4ea0c7cbb145aaa',
          },
          {
            subgraphId:
              '0x0b3517c2ea73a13072aaa893aa07f0a1083726a43e58f625d7d2451c9d75cab5-43-8',
            nonce: '8',
            from: '0xbbbf0e896a78a1848e4fa25ce901108f0d61c7f4',
            targetTariAddress:
              '2v2F8934h12kj34j15h12k3k5j1j32h123ffaalla9333FF',
            amount: '88800000000000000',
            blockNumber: 8173000,
            blockTimestamp: new Date(),
            transactionHash:
              '0xccccb651962001cd8ba6f64be6c9bd1569df63f961cda1f6e4ea0c7cbb145bbb',
          },
        ],
      );

      const result2 = await service.onEventReceived(
        {} as unknown as EventBridgeEvent<any, any>,
      );

      expect(result2).toHaveLength(2);
      expect(result2[0].subgraphId).toEqual(
        '0x0b3517c2ea73a13072aaa893aa07f0a1083726a43e58f625d7d2451c9d75cab5-43-5',
      );
      expect(result2[1].subgraphId).toEqual(
        '0x0b3517c2ea73a13072aaa893aa07f0a1083726a43e58f625d7d2451c9d75cab5-43-8',
      );
      expect(result2[0].nonce).toEqual('5');
      expect(result2[1].nonce).toEqual('8');

      const data = await getRepository(TokensUnwrappedEntity).find({
        order: { nonce: 'ASC' },
      });

      expect(data).toHaveLength(5);
      expect(data.map((d) => d.nonce)).toEqual([2, 3, 4, 5, 8]);
    });
    it('should properly handle the case where some records are already saved', async () => {
      const initialRecords = [
        {
          subgraphId:
            '0x0b3517c2ea73a13072aaa893aa07f0a1083726a43e58f625d7d2451c9d75cab5-43-2',
          nonce: 2,
          from: '0x226f0e896a78a1848e4fa25ce901108f0d61c7f3',
          targetTariAddress: '3a1F8934h12kj34j15h12k3k5j1j32h123ffaalla939666',
          amount: '20000000000000000',
          blockNumber: 8172949,
          blockTimestamp: new Date(),
          transactionHash:
            '0x349722eabb3e135b18882cecdc2c86f177332c4cb0503c27eb910b4a32d27a0d',
        },
        {
          subgraphId:
            '0x0b3517c2ea73a13072aaa893aa07f0a1083726a43e58f625d7d2451c9d75cab5-43-3',
          nonce: 3,
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

      const initialData = await getRepository(TokensUnwrappedEntity).find();
      expect(initialData).toHaveLength(2);
      expect(initialData.map((d) => d.nonce)).toEqual([
      2, 3
        
      ]);
      expect(initialData.map((d) => d.subgraphId)).toEqual([
        '0x0b3517c2ea73a13072aaa893aa07f0a1083726a43e58f625d7d2451c9d75cab5-43-2',
        '0x0b3517c2ea73a13072aaa893aa07f0a1083726a43e58f625d7d2451c9d75cab5-43-3'
      ]);

      const result = await service.onEventReceived(
        {} as unknown as EventBridgeEvent<any, any>,
      );

      expect(result).toHaveLength(1);
      expect(result[0].subgraphId).toEqual(
        '0x0b3517c2ea73a13072aaa893aa07f0a1083726a43e58f625d7d2451c9d75cab5-43-4',
      );
      expect(result[0].nonce).toEqual('4');

      expect(
        SubgraphClientServiceMock.getTokensUnwrappedRecords,
      ).toHaveBeenCalledWith(3);

      const finalData = await getRepository(TokensUnwrappedEntity).find({
        order: { nonce: 'ASC' },
      });

      expect(finalData).toHaveLength(3);
      expect(finalData.map((d) => d.nonce)).toEqual([2, 3, 4]);
    });
  });
});
