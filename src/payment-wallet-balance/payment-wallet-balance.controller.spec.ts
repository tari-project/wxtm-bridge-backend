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

describe('WrapTokenTransactionController', () => {
  let app: INestApplication;
  let factory: Factory;
  const m2mToken = 'test-m2m-auth-token';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [config], isGlobal: true }),
        TestDatabaseModule,
        M2MAuthModule.register({ authToken: m2mToken }),
        PaymentWalletBalanceModule,
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
});
