import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import config from '../config/config';
import {
  TestDatabaseModule,
  initializeDatabase,
  clearDatabase,
  getRepository,
} from '../../test/database';
import { setMiddlewares } from '../helpers/setMiddlewares';
import { Auth0Keys } from '../auth/auth.providers';
import { Auth0KeysMock } from '../../test/mocks/auth0-keys.mock';
import { getAccessToken } from '../../test/utils/getAccessToken';
import { Factory, getFactory } from '../../test/factory/factory';
import { TokensUnwrappedModule } from './tokens-unwrapped.module';
import { UserEntity } from '../user/user.entity';
import { TokensUnwrappedEntity } from './tokens-unwrapped.entity';
import { TokensUnwrappedStatus } from './tokens-unwrapped.const';
import { UpdateTokensUnwrappedDTO } from './tokens-unwrapped.dto';

describe('TokensUnwrappedController', () => {
  let app: INestApplication;
  let factory: Factory;
  let adminAccessToken: string;
  let userAccessToken: string;
  let admin: UserEntity;
  let user: UserEntity;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [config], isGlobal: true }),
        TestDatabaseModule,
        TokensUnwrappedModule,
      ],
    })
      .overrideProvider(Auth0Keys)
      .useValue(Auth0KeysMock)
      .compile();

    app = module.createNestApplication({ bodyParser: true });
    setMiddlewares(app);
    await app.init();

    await initializeDatabase();
    factory = await getFactory();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await clearDatabase();

    admin = await factory.create<UserEntity>(UserEntity.name, {
      isAdmin: true,
    });
    adminAccessToken = getAccessToken(admin.auth0Id);

    user = await factory.create<UserEntity>(UserEntity.name, {
      isAdmin: false,
    });
    userAccessToken = getAccessToken(user.auth0Id);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /tokens-unwrapped', () => {
    it('returns all unwrapped tokens transactions for the admin', async () => {
      await factory.createMany<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        3,
      );

      const { body } = await request(app.getHttpServer())
        .get('/tokens-unwrapped')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(body).toHaveLength(3);
      expect(body[0]).toHaveProperty('id');
    });

    it('returns 401 for a regular user', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/tokens-unwrapped')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(401);

      expect(body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });
  });

  describe('GET /tokens-unwrapped/:id', () => {
    it('returns a specific unwrapped token transaction for the admin', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
      );

      const { body } = await request(app.getHttpServer())
        .get(`/tokens-unwrapped/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(body).toHaveProperty('id', transaction.id);
    });

    it('returns 401 for a regular user', async () => {
      const transactionId = 2;

      const { body } = await request(app.getHttpServer())
        .get(`/tokens-unwrapped/${transactionId}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(401);

      expect(body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });
  });

  describe('PATCH /tokens-unwrapped/:id', () => {
    it('successfully updates status', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
      );

      const dto: UpdateTokensUnwrappedDTO = {
        status: TokensUnwrappedStatus.TOKENS_MINTED,
      };

      const { body } = await request(app.getHttpServer())
        .patch(`/tokens-unwrapped/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: transaction.id,
          status: TokensUnwrappedStatus.TOKENS_MINTED,
        }),
      );

      const updatedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({ where: { id: transaction.id } });

      expect(updatedTransaction?.status).toBe(
        TokensUnwrappedStatus.TOKENS_MINTED,
      );
    });

    it('returns 401 for a regular user', async () => {
      const dto: UpdateTokensUnwrappedDTO = {
        status: TokensUnwrappedStatus.TOKENS_MINTED,
      };

      const transactionId = 1;

      const { body } = await request(app.getHttpServer())
        .patch(`/tokens-unwrapped/${transactionId}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(dto)
        .expect(401);

      expect(body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });
  });
});
