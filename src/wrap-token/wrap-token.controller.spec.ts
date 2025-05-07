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

import { WrapTokenModule } from './wrap-token.module';
import { CreateWrapTokenReqDTO } from './wrap-token.dto';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';

describe('WrapTokenController', () => {
  let app: INestApplication;
  let factory: Factory;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [config], isGlobal: true }),
        TestDatabaseModule,
        WrapTokenModule,
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

  describe('POST /wrap-token', () => {
    it('creates a new transaction and returns paymentId', async () => {
      const dto: CreateWrapTokenReqDTO = {
        from: 'tari_address_123',
        to: '0xD34dB33F000000000000000000000000DeAdBeEf',
        tokenAmount: '1000000',
      };

      const { body } = await request(app.getHttpServer())
        .post('/wrap-token')
        .set('Content-Type', 'application/json')
        .send(dto)
        .expect(201);

      const [transaction] = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(body).toEqual({
        paymentId: transaction.paymentId,
      });

      expect(transaction).toEqual(
        expect.objectContaining({
          from: dto.from,
          to: dto.to,
          tokenAmount: dto.tokenAmount,
          status: WrapTokenTransactionStatus.CREATED,
          paymentId: body.paymentId,
          feePercentageBps: 25,
          feeAmount: '2500',
          amountAfterFee: '997500',
        }),
      );
    });
  });

  describe('PATCH /wrap-token/tokens-sent/:paymentId', () => {
    it('updates transaction status to TOKENS_SENT', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        {
          status: WrapTokenTransactionStatus.CREATED,
        },
      );

      const { body } = await request(app.getHttpServer())
        .patch(`/wrap-token/tokens-sent/${transaction.paymentId}`)
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
        .patch(`/wrap-token/tokens-sent/${transaction.paymentId}`)
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
});
