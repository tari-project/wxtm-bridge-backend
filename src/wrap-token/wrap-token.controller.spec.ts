import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { utils } from 'ethers';

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
import { CreateWrapTokenReqDTO, UserTransactionStatus } from './wrap-token.dto';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { WrapTokenAuditEntity } from '../wrap-token-audit/wrap-token-audit.entity';

describe('WrapTokenController', () => {
  let app: INestApplication;
  let factory: Factory;
  const coldWalletAddress = '0xTestColdWalletAddress';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              ...config(),
              coldWalletAddress,
              fees: {
                wrapTokenFeePercentageBps: 0.3 * 100, // 0.3% in basis points
              },
            }),
          ],
          isGlobal: true,
        }),
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
        tokenAmount: '1000000000',
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
          userProvidedTokenAmount: dto.tokenAmount,
          status: WrapTokenTransactionStatus.CREATED,
          paymentId: body.paymentId,
          feePercentageBps: 30,
          feeAmount: '3000000',
          amountAfterFee: '997000000',
        }),
      );

      const auditRecords = await getRepository(WrapTokenAuditEntity).find();
      expect(auditRecords).toHaveLength(1);
      expect(auditRecords[0]).toEqual(
        expect.objectContaining({
          transactionId: transaction.id,
          paymentId: transaction.paymentId,
          fromStatus: null,
          toStatus: WrapTokenTransactionStatus.CREATED,
        }),
      );
    });

    it.each([
      { amount: '999', description: 'amount less than 1000' },
      {
        amount: '1000000001',
        description: 'amount greater than 1000 000 000',
      },
    ])('returns 400 when $description', async ({ amount }) => {
      const tokenAmount = utils.parseUnits(amount, 6).toString();

      const dto: CreateWrapTokenReqDTO = {
        from: 'tari_address_123',
        to: '0xD34dB33F000000000000000000000000DeAdBeEf',
        tokenAmount,
      };

      const { body } = await request(app.getHttpServer())
        .post('/wrap-token')
        .set('Content-Type', 'application/json')
        .send(dto)
        .expect(400);

      expect(body).toEqual({
        error: 'Bad Request',
        message: [
          'tokenAmount must be a numeric string greater than  1000000000 and less than 1000000000000000',
        ],
        statusCode: 400,
      });
    });
  });

  describe('PATCH /wrap-token/tokens-sent/:paymentId', () => {
    it('updates transaction status to TOKENS_SENT and creates an audit record', async () => {
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

      const auditRecords = await getRepository(WrapTokenAuditEntity).find();
      expect(auditRecords).toHaveLength(1);
      expect(auditRecords[0]).toEqual(
        expect.objectContaining({
          transactionId: transaction.id,
          paymentId: transaction.paymentId,
          fromStatus: WrapTokenTransactionStatus.CREATED,
          toStatus: WrapTokenTransactionStatus.TOKENS_SENT,
        }),
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

  describe('GET /wrap-token/transactions', () => {
    it('returns transactions for the specified wallet address', async () => {
      const walletAddress = 'tari_address_123';
      const otherWalletAddress = 'tari_address_456';

      const [transaction_1, transaction_2] =
        await factory.createMany<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          3,
          [
            {
              from: walletAddress,
              status: WrapTokenTransactionStatus.CREATED,
            },
            {
              from: walletAddress,
              status: WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED,
            },
            {
              from: otherWalletAddress,
              status: WrapTokenTransactionStatus.CREATED,
            },
          ],
        );

      const { body } = await request(app.getHttpServer())
        .get(`/wrap-token/transactions?walletAddress=${walletAddress}`)
        .expect(200);

      expect(body).toEqual({
        transactions: expect.arrayContaining([
          {
            paymentId: transaction_1.paymentId,
            destinationAddress: transaction_1.to,
            tokenAmount: transaction_1.tokenAmount,
            amountAfterFee: transaction_1.amountAfterFee,
            feeAmount: transaction_1.feeAmount,
            createdAt: transaction_1.createdAt.toISOString(),
            status: UserTransactionStatus.PENDING,
          },
          {
            paymentId: transaction_2.paymentId,
            destinationAddress: transaction_2.to,
            tokenAmount: transaction_2.tokenAmount,
            amountAfterFee: transaction_2.amountAfterFee,
            feeAmount: transaction_2.feeAmount,
            createdAt: transaction_2.createdAt.toISOString(),
            status: UserTransactionStatus.SUCCESS,
          },
        ]),
      });
    });

    it('returns an empty array when no transactions exist for the wallet', async () => {
      const walletAddress = 'non_existent_wallet';

      const { body } = await request(app.getHttpServer())
        .get(`/wrap-token/transactions?walletAddress=${walletAddress}`)
        .expect(200);

      expect(body).toEqual({
        transactions: [],
      });
    });

    it.each([
      [WrapTokenTransactionStatus.CREATED, UserTransactionStatus.PENDING],
      [WrapTokenTransactionStatus.TOKENS_SENT, UserTransactionStatus.PENDING],
      [
        WrapTokenTransactionStatus.TOKENS_RECEIVED,
        UserTransactionStatus.TOKENS_RECEIVED,
      ],
      [
        WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
        UserTransactionStatus.PENDING,
      ],
      [
        WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
        UserTransactionStatus.PROCESSING,
      ],
      [
        WrapTokenTransactionStatus.SIGNING_SAFE_TRANSACTION,
        UserTransactionStatus.PROCESSING,
      ],
      [
        WrapTokenTransactionStatus.SAFE_TRANSACTION_SIGNED,
        UserTransactionStatus.PROCESSING,
      ],
      [
        WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
        UserTransactionStatus.PROCESSING,
      ],
      [WrapTokenTransactionStatus.TIMEOUT, UserTransactionStatus.TIMEOUT],
      [
        WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED,
        UserTransactionStatus.SUCCESS,
      ],
    ])(
      'maps transaction status %s to user status %s',
      async (txStatus, expectedUserStatus) => {
        const walletAddress = 'tari_address_123';

        await factory.create<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          {
            from: walletAddress,
            status: txStatus,
          },
        );

        const { body } = await request(app.getHttpServer())
          .get(`/wrap-token/transactions?walletAddress=${walletAddress}`)
          .expect(200);

        expect(body.transactions).toHaveLength(1);
        expect(body.transactions[0].status).toBe(expectedUserStatus);
      },
    );
  });

  describe('GET /wrap-token/params', () => {
    it('returns the wrap token parameters from configuration', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/wrap-token/params')
        .expect(200);

      expect(body).toEqual({
        coldWalletAddress,
        wrapTokenFeePercentageBps: 30,
      });
    });
  });
});
