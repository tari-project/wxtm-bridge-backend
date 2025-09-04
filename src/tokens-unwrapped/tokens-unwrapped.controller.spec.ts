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
import { UserUnwrappedTransactionStatus } from './tokens-unwrapped.dto';

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

  describe('GET /tokens-unwrapped/transactions', () => {
    it('returns transactions for the specified Tari address', async () => {
      const tariAddress =
        'f4e6b6a1d2a3e5c8f9b0d1e2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c';
      const otherTariAddress =
        'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';

      const [transaction_1, transaction_2] =
        await factory.createMany<TokensUnwrappedEntity>(
          TokensUnwrappedEntity.name,
          3,
          [
            {
              targetTariAddress: tariAddress,
              status: TokensUnwrappedStatus.CREATED,
              transactionHash: '0x1234567890abcdef',
            },
            {
              targetTariAddress: tariAddress,
              status: TokensUnwrappedStatus.TOKENS_SENT,
            },
            {
              targetTariAddress: otherTariAddress,
              status: TokensUnwrappedStatus.CREATED,
            },
          ],
        );

      const { body } = await request(app.getHttpServer())
        .get(`/tokens-unwrapped/transactions?tariAddress=${tariAddress}`)
        .expect(200);

      expect(body).toEqual({
        transactions: expect.arrayContaining([
          {
            paymentId: transaction_1.paymentId,
            destinationAddress: transaction_1.targetTariAddress,
            amount: transaction_1.amount,
            amountAfterFee: transaction_1.amountAfterFee,
            feeAmount: transaction_1.feeAmount,
            createdAt: transaction_1.createdAt.toISOString(),
            status: UserUnwrappedTransactionStatus.PENDING,
            transactionHash: transaction_1.transactionHash,
          },
          {
            paymentId: transaction_2.paymentId,
            destinationAddress: transaction_2.targetTariAddress,
            amount: transaction_2.amount,
            amountAfterFee: transaction_2.amountAfterFee,
            feeAmount: transaction_2.feeAmount,
            createdAt: transaction_2.createdAt.toISOString(),
            status: UserUnwrappedTransactionStatus.SUCCESS,
            transactionHash: transaction_2.transactionHash,
          },
        ]),
      });
    });

    it('returns an empty array when no transactions exist for the Tari address', async () => {
      const tariAddress = 'non_existent_tari_address';

      const { body } = await request(app.getHttpServer())
        .get(`/tokens-unwrapped/transactions?tariAddress=${tariAddress}`)
        .expect(200);

      expect(body).toEqual({
        transactions: [],
      });
    });

    it.each([
      [TokensUnwrappedStatus.CREATED, UserUnwrappedTransactionStatus.PENDING],
      [
        TokensUnwrappedStatus.AWAITING_CONFIRMATION,
        UserUnwrappedTransactionStatus.PENDING,
      ],
      [
        TokensUnwrappedStatus.CONFIRMED_AWAITING_APPROVAL,
        UserUnwrappedTransactionStatus.PENDING,
      ],
      [
        TokensUnwrappedStatus.CONFIRMED,
        UserUnwrappedTransactionStatus.PROCESSING,
      ],
      [
        TokensUnwrappedStatus.INIT_SEND_TOKENS,
        UserUnwrappedTransactionStatus.PROCESSING,
      ],
      [
        TokensUnwrappedStatus.SENDING_TOKENS,
        UserUnwrappedTransactionStatus.PROCESSING,
      ],
      [
        TokensUnwrappedStatus.TOKENS_SENT,
        UserUnwrappedTransactionStatus.SUCCESS,
      ],
      [
        TokensUnwrappedStatus.UNPROCESSABLE,
        UserUnwrappedTransactionStatus.ERROR,
      ],
    ])(
      'maps transaction status %s to user status %s',
      async (txStatus, expectedUserStatus) => {
        const tariAddress =
          'f4e6b6a1d2a3e5c8f9b0d1e2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c';

        await factory.create<TokensUnwrappedEntity>(
          TokensUnwrappedEntity.name,
          {
            targetTariAddress: tariAddress,
            status: txStatus,
          },
        );

        const { body } = await request(app.getHttpServer())
          .get(`/tokens-unwrapped/transactions?tariAddress=${tariAddress}`)
          .expect(200);

        expect(body.transactions).toHaveLength(1);
        expect(body.transactions[0].status).toBe(expectedUserStatus);
      },
    );
  });

  describe('PATCH /tokens-unwrapped/approve/:id', () => {
    it('should approve transaction with status CONFIRMED_AWAITING_APPROVAL', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        {
          status: TokensUnwrappedStatus.CONFIRMED_AWAITING_APPROVAL,
        },
      );

      const { body } = await request(app.getHttpServer())
        .patch(`/tokens-unwrapped/approve/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(body).toEqual({ success: true });

      const updatedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({ where: { id: transaction.id } });

      expect(updatedTransaction).toEqual({
        ...transaction,
        status: TokensUnwrappedStatus.CONFIRMED,
        approvingUserId: admin.id,
        updatedAt: expect.any(Date),
      });
    });

    it('should not approve transaction with status other than CONFIRMED_AWAITING_APPROVAL', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        {
          status: TokensUnwrappedStatus.CREATED,
        },
      );

      const { body } = await request(app.getHttpServer())
        .patch(`/tokens-unwrapped/approve/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(body).toEqual({ success: false });

      const updatedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({ where: { id: transaction.id } });

      expect(updatedTransaction).toEqual({
        ...transaction,
        status: TokensUnwrappedStatus.CREATED,
        approvingUserId: null,
        updatedAt: expect.any(Date),
      });
    });

    it('returns 401 for a regular user', async () => {
      const transactionId = 1;

      const { body } = await request(app.getHttpServer())
        .patch(`/tokens-unwrapped/approve/${transactionId}`)
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
