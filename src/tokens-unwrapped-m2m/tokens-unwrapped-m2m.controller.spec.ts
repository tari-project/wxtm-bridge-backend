import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import config from '../config/config';
import {
  TestDatabaseModule,
  initializeDatabase,
  clearDatabase,
} from '../../test/database';
import { setMiddlewares } from '../helpers/setMiddlewares';
import { Factory, getFactory } from '../../test/factory/factory';
import { TokensUnwrappedM2MModule } from './tokens-unwrapped-m2m.module';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { M2MAuthModule } from '../m2m-auth/m2m-auth.module';

describe('TokensUnwrappedM2MController', () => {
  let app: INestApplication;
  let factory: Factory;
  const m2mToken = 'test-m2m-auth-token';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              ...config(),
              domain: 'example.com',
            }),
          ],
          isGlobal: true,
        }),
        TestDatabaseModule,
        M2MAuthModule.register({ authToken: m2mToken }),
        TokensUnwrappedM2MModule,
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

  describe('GET /tokens-unwrapped-m2m', () => {
    it('returns all transactions with valid M2M auth token', async () => {
      await factory.createMany<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        3,
      );

      const { body } = await request(app.getHttpServer())
        .get('/tokens-unwrapped-m2m')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .expect(200);

      expect(body).toHaveLength(3);
    });

    it('returns 401 with invalid M2M auth token', async () => {
      await request(app.getHttpServer())
        .get('/tokens-unwrapped-m2m')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /tokens-unwrapped-m2m/:id', () => {
    it('returns a specific transaction with valid M2M auth token', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
      );

      const { body } = await request(app.getHttpServer())
        .get(`/tokens-unwrapped-m2m/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .expect(200);

      expect(body.id).toBe(transaction.id);
    });

    it('returns 401 with incorrect M2M auth token', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
      );

      await request(app.getHttpServer())
        .get(`/tokens-unwrapped-m2m/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
