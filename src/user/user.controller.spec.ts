import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { Factory, getFactory } from '../../test/factory/factory';

import config from '../config/config';
import {
  TestDatabaseModule,
  initializeDatabase,
  clearDatabase,
} from '../../test/database';
import { UserModule } from './user.module';
import { UserEntity } from './user.entity';
import { setMiddlewares } from '../helpers/setMiddlewares';

describe('UserController', () => {
  let app: INestApplication;
  let factory: Factory;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [config], isGlobal: true }),
        TestDatabaseModule,
        UserModule,
      ],
    }).compile();

    app = module.createNestApplication({ bodyParser: true });
    setMiddlewares(app);
    await app.init();

    await initializeDatabase();
    factory = await getFactory();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await clearDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('creates user if not exists', async () => {
      await factory.createMany<UserEntity>('UserEntity', 2);

      const { body } = await request(app.getHttpServer())
        .get('/user')
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(body).toHaveLength(2);
    });
  });
});
