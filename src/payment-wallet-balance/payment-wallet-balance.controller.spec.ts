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
import { Factory, getFactory } from '../../test/factory/factory';
import { PaymentWalletBalanceModule } from './payment-wallet-balance.module';
import { PaymentWalletBalanceDTO } from './payment-wallet-balance.dto';
import { M2MAuthModule } from '../m2m-auth/m2m-auth.module';
import { PaymentWalletBalanceEntity } from './payment-wallet-balance.entity';
import { TokensUnwrappedStatus } from '../tokens-unwrapped/tokens-unwrapped.const';
import { UserEntity } from '../user/user.entity';
import { getAccessToken } from '../../test/utils/getAccessToken';
import { Auth0Keys } from '../auth/auth.providers';
import { Auth0KeysMock } from '../../test/mocks/auth0-keys.mock';

describe('WrapTokenTransactionController', () => {
  let app: INestApplication;
  let factory: Factory;
  const m2mToken = 'test-m2m-auth-token';
  let adminAccessToken: string;
  let userAccessToken: string;
  let admin: UserEntity;
  let user: UserEntity;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [config], isGlobal: true }),
        TestDatabaseModule,
        M2MAuthModule.register({ authToken: m2mToken }),
        PaymentWalletBalanceModule,
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

  describe('PATCH /payment-wallet-balance', () => {
    it('returns 401 with invalid M2M auth token', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/payment-wallet-balance`)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer invalid-token')
        .send({})
        .expect(401);

      expect(body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    it('updates wallet balance', async () => {
      await factory.create<PaymentWalletBalanceEntity>(
        PaymentWalletBalanceEntity.name,
        {},
      );

      const dto: PaymentWalletBalanceDTO = {
        availableBalance: '1000',
        pendingIncomingBalance: '2000',
        pendingOutgoingBalance: '3000',
        timelockedBalance: '4000',
      };

      const { body } = await request(app.getHttpServer())
        .patch(`/payment-wallet-balance`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual({ success: true });

      const balances = await getRepository(PaymentWalletBalanceEntity).find();
      expect(balances).toHaveLength(1);
      expect(balances[0]).toMatchObject({
        id: 1,
        availableBalance: '1000',
        pendingIncomingBalance: '2000',
        pendingOutgoingBalance: '3000',
        timelockedBalance: '4000',
      });
    });
  });

  describe('GET /payment-wallet-balance', () => {
    it('returns 401 without token', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/payment-wallet-balance`)
        .set('Content-Type', 'application/json')
        .expect(401);

      expect(body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    it('returns 401 for a regular user', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/payment-wallet-balance`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(401);

      expect(body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    it('calculates and returns balances', async () => {
      await factory.create<PaymentWalletBalanceEntity>(
        PaymentWalletBalanceEntity.name,
        { availableBalance: '2000', pendingIncomingBalance: '4000' },
      );

      await factory.createMany('TokensUnwrappedEntity', [
        {
          amountAfterFee: '1000',
          status: TokensUnwrappedStatus.CREATED,
        },
        {
          amountAfterFee: '1000',
          status: TokensUnwrappedStatus.CREATED_UNPROCESSABLE,
        },
        {
          amountAfterFee: '1000',
          status: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
        },
        {
          amountAfterFee: '1000',
          status: TokensUnwrappedStatus.AWAITING_CONFIRMATION_UNPROCESSABLE,
        },
        {
          amountAfterFee: '1000',
          status: TokensUnwrappedStatus.CONFIRMED_AWAITING_APPROVAL,
        },
        {
          amountAfterFee: '1000',
          status: TokensUnwrappedStatus.INIT_SEND_TOKENS,
        },
        {
          amountAfterFee: '1000',
          status: TokensUnwrappedStatus.SENDING_TOKENS,
        },
        {
          amountAfterFee: '1000',
          status: TokensUnwrappedStatus.TOKENS_SENT,
        },
        {
          amountAfterFee: '1000',
          status: TokensUnwrappedStatus.SENDING_TOKENS_UNPROCESSABLE,
        },
      ]);

      const { body } = await request(app.getHttpServer())
        .get(`/payment-wallet-balance`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(body).toEqual({
        availableWalletBalance: '1000',
        pendingTransactionsAmount: '5000',
        walletBalance: '6000',
      });
    });

    it('calculates negative balance', async () => {
      await factory.create<PaymentWalletBalanceEntity>(
        PaymentWalletBalanceEntity.name,
        { availableBalance: '0', pendingIncomingBalance: '0' },
      );

      await factory.createMany('TokensUnwrappedEntity', [
        {
          amountAfterFee: '1000',
          status: TokensUnwrappedStatus.CREATED,
        },
        {
          amountAfterFee: '1000',
          status: TokensUnwrappedStatus.CREATED,
        },
      ]);

      const { body } = await request(app.getHttpServer())
        .get(`/payment-wallet-balance`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(body).toEqual({
        availableWalletBalance: '-2000',
        pendingTransactionsAmount: '2000',
        walletBalance: '0',
      });
    });
  });
});
