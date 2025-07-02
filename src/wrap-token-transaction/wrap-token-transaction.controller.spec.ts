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
import { WrapTokenAuditEntity } from '../wrap-token-audit/wrap-token-audit.entity';
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
      expect(body[0].audits).toHaveLength(0);
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

      const [audit_1, audit_2] = await factory.createMany<WrapTokenAuditEntity>(
        WrapTokenAuditEntity.name,
        2,
        { transactionId: transaction.id },
      );

      const { body } = await request(app.getHttpServer())
        .get(`/wrap-token-transactions/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(body).toHaveProperty('id', transaction.id);

      expect(body.audits).toHaveLength(2);
      expect(body.audits).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: audit_1.id,
            transactionId: transaction.id,
          }),
          expect.objectContaining({
            id: audit_2.id,
            transactionId: transaction.id,
          }),
        ]),
      );
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

  describe('PATCH /wrap-token-transactions/:id', () => {
    it('updates transaction from CREATING_SAFE_TRANSACTION_UNPROCESSABLE to TOKENS_RECEIVED', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,

        {
          error: [{ message: 'Test error message' }],
          status:
            WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION_UNPROCESSABLE,
        },
      );

      const { body } = await request(app.getHttpServer())
        .patch(`/wrap-token-transactions/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({})
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: transaction.id,
        }),
      );

      const updatedTransaction = await getRepository(
        WrapTokenTransactionEntity,
      ).findOne({ where: { id: transaction.id } });

      expect(updatedTransaction).toEqual({
        ...transaction,
        status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
        error: [],
        isNotificationSent: false,
        updatedAt: expect.any(Date),
      });
    });

    it('updates transaction from SAFE_TRANSACTION_UNPROCESSABLE to SAFE_TRANSACTION_CREATED', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        {
          error: [{ message: 'Safe transaction error' }],
          status: WrapTokenTransactionStatus.SAFE_TRANSACTION_UNPROCESSABLE,
        },
      );

      const { body } = await request(app.getHttpServer())
        .patch(`/wrap-token-transactions/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({})
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: transaction.id,
        }),
      );

      const updatedTransaction = await getRepository(
        WrapTokenTransactionEntity,
      ).findOne({ where: { id: transaction.id } });

      expect(updatedTransaction).toEqual({
        ...transaction,
        status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
        error: [],
        isNotificationSent: false,
        updatedAt: expect.any(Date),
      });
    });

    it('leaves transaction unchanged if status does not match any conditions', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        {
          status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
        },
      );

      const { body } = await request(app.getHttpServer())
        .patch(`/wrap-token-transactions/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({})
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: transaction.id,
        }),
      );

      const unchangedTransaction = await getRepository(
        WrapTokenTransactionEntity,
      ).findOne({ where: { id: transaction.id } });

      expect(unchangedTransaction).toEqual({
        ...transaction,
      });
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
