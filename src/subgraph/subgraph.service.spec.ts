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
import { UserEntity } from '../user/user.entity';

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
    }).compile();

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
    it('happy path', async () => {
      const user = await factory.create<UserEntity>(UserEntity.name);
      const result = await service.onEventReceived(
        {} as unknown as EventBridgeEvent<any, any>,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(user.id);
    });
  });
});
