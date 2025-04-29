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
import { WrapTokenTransactionModule } from './wrap-token-transaction.module';
import { UserEntity } from '../user/user.entity';
import { WrapTokenTransactionEntity } from './wrap-token-transaction.entity';
import {
  CreateWrapTokenTransactionDTO,
  UpdateWrapTokenTransactionDTO,
} from './wrap-token-transaction.dto';
import { WrapTokenTransactionStatus } from './wrap-token-transaction.const';

describe('WrapTokenTransactionController', () => {
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
        WrapTokenTransactionModule,
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

  describe('GET /wrap-token-transactions', () => {
    it('returns all transactions for the admin', async () => {
      await factory.createMany<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        3,
      );

      const { body } = await request(app.getHttpServer())
        .get('/wrap-token-transactions')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(body).toHaveLength(3);
    });

    it('returns 401 for a regular user', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/wrap-token-transactions')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(401);

      expect(body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });
  });

  describe('GET /wrap-token-transactions/:id', () => {
    it('returns a specific transaction for the admin', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
      );

      const { body } = await request(app.getHttpServer())
        .get(`/wrap-token-transactions/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(body).toHaveProperty('id', transaction.id);
    });

    it('returns 401 for a regular user', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
      );

      const { body } = await request(app.getHttpServer())
        .get(`/wrap-token-transactions/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(401);

      expect(body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });
  });

  describe('POST /wrap-token-transactions', () => {
    it('creates a new transaction and returns the DTO', async () => {
      const dto: CreateWrapTokenTransactionDTO = {
        from: 'tari_address_123',
        to: '0xD34dB33F000000000000000000000000DeAdBeEf',
        tokenAmount: '1000',
      };

      const { body } = await request(app.getHttpServer())
        .post('/wrap-token-transactions')
        .set('Content-Type', 'application/json')
        .send(dto)
        .expect(201);

      const [transaction] = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(body).toEqual(
        expect.objectContaining({
          id: transaction.id,
          paymentId: transaction.paymentId,
          from: dto.from,
          to: dto.to,
          tokenAmount: dto.tokenAmount,
          status: WrapTokenTransactionStatus.CREATED,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );
    });
  });

  describe('PATCH /wrap-token-transactions/tokens-sent/:id', () => {
    it('updates transaction status to TOKENS_SENT for admin', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        {
          status: WrapTokenTransactionStatus.CREATED,
        },
      );

      const { body } = await request(app.getHttpServer())
        .patch(`/wrap-token-transactions/tokens-sent/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(body).toEqual({
        success: true,
      });

      const updatedTransaction = await getRepository(
        WrapTokenTransactionEntity,
      ).findOne({ where: { id: transaction.id } });

      expect(updatedTransaction?.status).toBe(
        WrapTokenTransactionStatus.TOKENS_SENT,
      );
    });

    it('returns 400 when transaction status is not CREATED', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        {
          status: WrapTokenTransactionStatus.TOKENS_SENT,
        },
      );

      const { body } = await request(app.getHttpServer())
        .patch(`/wrap-token-transactions/tokens-sent/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(body).toEqual({
        statusCode: 400,
        message: 'Transaction status is incorrect',
        error: 'Bad Request',
      });

      const unchangedTransaction = await getRepository(
        WrapTokenTransactionEntity,
      ).findOne({ where: { id: transaction.id } });

      expect(unchangedTransaction?.status).toBe(
        WrapTokenTransactionStatus.TOKENS_SENT,
      );
    });
  });

  describe('PATCH /wrap-token-transactions/:id', () => {
    it('successfully updates tokenAmount and status', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
      );

      const dto: UpdateWrapTokenTransactionDTO = {
        tokenAmount: '2000',
        status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
      };

      const { body } = await request(app.getHttpServer())
        .patch(`/wrap-token-transactions/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: transaction.id,
          tokenAmount: dto.tokenAmount,
          status: dto.status,
        }),
      );

      const updatedTransaction = await getRepository(
        WrapTokenTransactionEntity,
      ).findOne({ where: { id: transaction.id } });

      expect(updatedTransaction?.tokenAmount).toBe(dto.tokenAmount);
      expect(updatedTransaction?.status).toBe(dto.status);
    });

    it('fails if updating tokenAmount when status is TOKENS_RECEIVED', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        {
          status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
        },
      );

      const dto: UpdateWrapTokenTransactionDTO = {
        tokenAmount: '2000',
      };

      const { body } = await request(app.getHttpServer())
        .patch(`/wrap-token-transactions/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto)
        .expect(400);

      expect(body).toEqual({
        error: 'Bad Request',
        message: 'Transaction status is incorrect',
        statusCode: 400,
      });
    });

    it('fails if changing status from TOKENS_RECEIVED to another status', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        {
          status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
        },
      );

      const dto: UpdateWrapTokenTransactionDTO = {
        status: WrapTokenTransactionStatus.TOKENS_SENT,
      };

      const { body } = await request(app.getHttpServer())
        .patch(`/wrap-token-transactions/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto)
        .expect(400);

      expect(body).toEqual({
        error: 'Bad Request',
        message: 'Transaction status is incorrect',
        statusCode: 400,
      });
    });

    it('fails if trying to update safeNonce when it already exists', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        {
          safeNonce: 123,
        },
      );

      const dto: UpdateWrapTokenTransactionDTO = {
        safeNonce: 456,
      };

      const { body } = await request(app.getHttpServer())
        .patch(`/wrap-token-transactions/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto)
        .expect(400);

      expect(body).toEqual({
        error: 'Bad Request',
        message: 'Transaction nonce already exists',
        statusCode: 400,
      });
    });

    it('successfully updates safeNonce when it does not exist', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
      );

      const dto: UpdateWrapTokenTransactionDTO = {
        safeNonce: 123,
      };

      const { body } = await request(app.getHttpServer())
        .patch(`/wrap-token-transactions/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: transaction.id,
          safeNonce: dto.safeNonce,
        }),
      );

      const updatedTransaction = await getRepository(
        WrapTokenTransactionEntity,
      ).findOne({ where: { id: transaction.id } });

      expect(updatedTransaction?.safeNonce).toBe(dto.safeNonce);
    });

    it('returns 401 for a regular user', async () => {
      const transactionId = 1;

      const { body } = await request(app.getHttpServer())
        .patch(`/wrap-token-transactions/${transactionId}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(401);

      expect(body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });
  });
});
