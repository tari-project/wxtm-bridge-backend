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
import { UserEntity } from '../user/user.entity';
import { TokensUnwrappedEntity } from '../subgraph/tokens-unwrapped.entity';

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
      // const token = await factory.create<TokensUnwrappedEntity>(
      //   TokensUnwrappedEntity.name,
      // );

      const result = await service.onEventReceived(
        {} as unknown as EventBridgeEvent<any, any>,
      );

      const tokens = await getRepository(TokensUnwrappedEntity).find();
      console.log('Available Tokens: ', tokens);

      expect(result).toHaveLength(2);
      expect(result[0].id).toEqual(tokens[0].id);
    });
  });
});
