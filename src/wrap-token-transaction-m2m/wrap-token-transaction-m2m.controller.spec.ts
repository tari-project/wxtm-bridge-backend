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
import { WrapTokenTransactionM2MModule } from './wrap-token-transaction-m2m.module';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import {
  ErrorUpdateRequestDTO,
  CreatingTransactionRequestDTO,
  TransactionCreatedRequestDTO,
  ExecutingTransactionRequestDTO,
  TransactionExecutedRequestDTO,
  TokensReceivedRequestDTO,
} from './wrap-token-transaction-m2m.dto';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { M2MAuthModule } from '../m2m-auth/m2m-auth.module';
import { WrapTokenAuditEntity } from '../wrap-token-audit/wrap-token-audit.entity';
import { TransactionEvaluationService } from '../transaction-evaluation/transaction-evaluation.service';
import { TransactionEvaluationServiceMock } from '../../test/mocks/transaction-evaluation.service.mock';

describe('WrapTokenTransactionController', () => {
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
              fees: {
                wrapTokenFeePercentageBps: 0.3 * 100, // 0.3% in basis points
              },
              domain: 'example.com',
            }),
          ],
          isGlobal: true,
        }),
        TestDatabaseModule,
        M2MAuthModule.register({ authToken: m2mToken }),
        WrapTokenTransactionM2MModule,
      ],
    })
      .overrideProvider(TransactionEvaluationService)
      .useValue(TransactionEvaluationServiceMock)
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /wrap-token-transactions-m2m', () => {
    it('returns 401 without M2M auth token', async () => {
      await request(app.getHttpServer())
        .get('/wrap-token-transactions-m2m')
        .set('Content-Type', 'application/json')
        .expect(401);
    });

    it('returns 401 with invalid M2M auth token', async () => {
      await request(app.getHttpServer())
        .get('/wrap-token-transactions-m2m')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('returns all transactions with valid M2M auth token', async () => {
      await factory.createMany<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        3,
      );

      const { body } = await request(app.getHttpServer())
        .get('/wrap-token-transactions-m2m')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .expect(200);

      expect(body).toHaveLength(3);
    });

    it('accepts M2M token in state-machine-auth header', async () => {
      await factory.createMany<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        3,
      );

      const { body } = await request(app.getHttpServer())
        .get('/wrap-token-transactions-m2m')
        .set('Content-Type', 'application/json')
        .set('state-machine-auth', m2mToken)
        .expect(200);

      expect(body).toHaveLength(3);
    });
  });

  describe('GET /wrap-token-transactions-m2m/:id', () => {
    it('returns 401 without M2M auth token', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
      );

      await request(app.getHttpServer())
        .get(`/wrap-token-transactions-m2m/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .expect(401);
    });

    it('returns a specific transaction for the admin', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
      );

      const { body } = await request(app.getHttpServer())
        .get(`/wrap-token-transactions-m2m/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .expect(200);

      expect(body).toHaveProperty('id', transaction.id);
    });
  });

  describe('PATCH /wrap-token-transactions-m2m/tokens-received', () => {
    it('should update transactions status to TOKENS_RECEIVED', async () => {
      const [tx_created, tx_timeout, tx_tokens_sent] =
        await factory.createMany<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          3,
          [
            { status: WrapTokenTransactionStatus.CREATED, tokenAmount: '1000' },
            { status: WrapTokenTransactionStatus.TIMEOUT, tokenAmount: '2000' },
            {
              status: WrapTokenTransactionStatus.TOKENS_SENT,
              tokenAmount: '5000',
            },
          ],
        );

      const dto: TokensReceivedRequestDTO = {
        walletTransactions: [
          {
            paymentId: tx_created.paymentId,
            amount: '1000',
            timestamp: 1747209999,
            blockHeight: 12345,
            paymentReference: 'ref1',
          },
          {
            paymentId: tx_timeout.paymentId,
            amount: '3000',
            timestamp: 1747210000,
            blockHeight: 12346,
            paymentReference: 'ref2',
          },
          {
            paymentId: tx_tokens_sent.paymentId,
            amount: '5000',
            timestamp: 1747210001,
            blockHeight: 12347,
            paymentReference: 'ref3',
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/tokens-received')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual({ success: true });

      const updatedTransactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(updatedTransactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: tx_created.id,
            status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
            tariTxTimestamp: 1747209999,
            tariBlockHeight: 12345,
            tariPaymentReference: 'ref1',
            tokenAmountInWallet: '1000',
          }),
          expect.objectContaining({
            id: tx_timeout.id,
            status: WrapTokenTransactionStatus.TOKENS_RECEIVED_WITH_MISMATCH,
            tariTxTimestamp: 1747210000,
            tariBlockHeight: 12346,
            tariPaymentReference: 'ref2',
            tokenAmountInWallet: '3000',
          }),
          expect.objectContaining({
            id: tx_tokens_sent.id,
            status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
            tariTxTimestamp: 1747210001,
            tariBlockHeight: 12347,
            tariPaymentReference: 'ref3',
            tokenAmountInWallet: '5000',
          }),
        ]),
      );

      const auditRecords = await getRepository(WrapTokenAuditEntity).find();

      expect(auditRecords).toHaveLength(3);
      expect(auditRecords).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            transactionId: tx_created.id,
            paymentId: tx_created.paymentId,
            fromStatus: WrapTokenTransactionStatus.CREATED,
            toStatus: WrapTokenTransactionStatus.TOKENS_RECEIVED,
          }),
          expect.objectContaining({
            transactionId: tx_timeout.id,
            paymentId: tx_timeout.paymentId,
            fromStatus: WrapTokenTransactionStatus.TIMEOUT,
            toStatus: WrapTokenTransactionStatus.TOKENS_RECEIVED_WITH_MISMATCH,
          }),
          expect.objectContaining({
            transactionId: tx_tokens_sent.id,
            paymentId: tx_tokens_sent.paymentId,
            fromStatus: WrapTokenTransactionStatus.TOKENS_SENT,
            toStatus: WrapTokenTransactionStatus.TOKENS_RECEIVED,
          }),
        ]),
      );
    });

    it.each([
      [WrapTokenTransactionStatus.TOKENS_RECEIVED, 'not in valid statuses'],
      [
        WrapTokenTransactionStatus.TOKENS_RECEIVED_WITH_MISMATCH,
        'not in valid statuses',
      ],
      [
        WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
        'not in valid statuses',
      ],
      [
        WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION_UNPROCESSABLE,
        'not in valid statuses',
      ],
      [
        WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
        'not in valid statuses',
      ],
      [
        WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
        'not in valid statuses',
      ],
      [
        WrapTokenTransactionStatus.SAFE_TRANSACTION_UNPROCESSABLE,
        'not in valid statuses',
      ],
    ])(
      'should not update transaction when status is %s (%s)',
      async (status, _description) => {
        const transaction = await factory.create<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          {
            status,
            tokenAmount: '1000',
          },
        );

        const dto: TokensReceivedRequestDTO = {
          walletTransactions: [
            {
              paymentId: transaction.paymentId,
              amount: '1000',
              timestamp: 1747209999,
              blockHeight: 12345,
              paymentReference: 'ref-v2',
            },
          ],
        };

        const { body } = await request(app.getHttpServer())
          .patch('/wrap-token-transactions-m2m/tokens-received')
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${m2mToken}`)
          .send(dto)
          .expect(200);

        expect(body).toEqual({ success: true });

        const unchangedTransaction = await getRepository(
          WrapTokenTransactionEntity,
        ).findOne({ where: { id: transaction.id } });

        expect(unchangedTransaction).toEqual(
          expect.objectContaining({
            id: transaction.id,
            status: status,
            tariBlockHeight: null,
            tariPaymentReference: null,
            tariTxTimestamp: null,
            tokenAmountInWallet: null,
          }),
        );

        const auditRecords = await getRepository(WrapTokenAuditEntity).find();
        expect(auditRecords).toHaveLength(0);
      },
    );

    it('should not be accessible with an incorrect token', async () => {
      const dto: TokensReceivedRequestDTO = {
        walletTransactions: [
          {
            paymentId: 'some-id',
            amount: '1000',
            timestamp: 123456,
            blockHeight: 1,
            paymentReference: 'ref',
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/tokens-received')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer invalid-token`)
        .send(dto)
        .expect(401);

      expect(body).toEqual({ message: 'Unauthorized', statusCode: 401 });
    });
  });

  describe('PATCH /wrap-token-transactions-m2m/creating-transaction', () => {
    it('should update transactions status to SAFE_TRANSACTION_CREATING and create audit records', async () => {
      const [tx_received, tx_other_status] =
        await factory.createMany<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          2,
          [
            {
              status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
              tariBlockHeight: 12345,
              tariPaymentReference: 'ref-123',
              tariTxTimestamp: 1747209999,
            },
            {
              status: WrapTokenTransactionStatus.CREATED,
              tariPaymentIdHex: '123',
            },
          ],
        );

      const dto: CreatingTransactionRequestDTO = {
        walletTransactions: [
          {
            paymentId: tx_received.paymentId,
          },
          {
            paymentId: tx_other_status.paymentId,
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/creating-transaction')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(400);

      expect(body).toEqual({
        error: 'Bad Request',
        message: `Transaction with paymentId ${tx_other_status.paymentId} not found`,
        statusCode: 400,
      });

      const updatedTransactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(updatedTransactions).toHaveLength(2);
      expect(updatedTransactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: tx_received.id,
            status: WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
            safeTxHash: null,
            safeNonce: null,
          }),
          expect.objectContaining({
            id: tx_other_status.id,
            status: WrapTokenTransactionStatus.CREATED,
            safeTxHash: null,
            safeNonce: null,
          }),
        ]),
      );

      const auditRecords = await getRepository(WrapTokenAuditEntity).find();
      expect(auditRecords).toHaveLength(1);
      expect(auditRecords[0]).toEqual(
        expect.objectContaining({
          transactionId: tx_received.id,
          paymentId: tx_received.paymentId,
          fromStatus: WrapTokenTransactionStatus.TOKENS_RECEIVED,
          toStatus: WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
        }),
      );
    });

    it('should not be accessible with an incorrect token', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/creating-transaction')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer incorect-token`)
        .send({})
        .expect(401);

      expect(body).toEqual({ message: 'Unauthorized', statusCode: 401 });
    });
  });

  describe('PATCH /wrap-token-transactions-m2m/transaction-created', () => {
    it('should update transactions status to SAFE_TRANSACTION_CREATED and create audit records', async () => {
      const [tx_received, tx_other_status] =
        await factory.createMany<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          2,
          [
            {
              status: WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
              tariBlockHeight: 12345,
              tariPaymentReference: 'ref-123',
              tariTxTimestamp: 1747209999,
            },
            {
              status: WrapTokenTransactionStatus.CREATED,
            },
          ],
        );

      const dto: TransactionCreatedRequestDTO = {
        walletTransactions: [
          {
            paymentId: tx_received.paymentId,
            safeTxHash: 'tx_1_hash',
            safeNonce: 1,
          },
          {
            paymentId: tx_other_status.paymentId,
            safeTxHash: 'tx_2_hash',
            safeNonce: 2,
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/transaction-created')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(400);

      expect(body).toEqual({
        error: 'Bad Request',
        message: `Transaction with paymentId ${tx_other_status.paymentId} not found`,
        statusCode: 400,
      });

      const updatedTransactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(updatedTransactions).toHaveLength(2);
      expect(updatedTransactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: tx_received.id,
            status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
            safeTxHash: 'tx_1_hash',
            safeNonce: 1,
            safeAddress: null,
          }),
          expect.objectContaining({
            id: tx_other_status.id,
            status: WrapTokenTransactionStatus.CREATED,
            safeTxHash: null,
            safeNonce: null,
            safeAddress: null,
          }),
        ]),
      );

      const auditRecords = await getRepository(WrapTokenAuditEntity).find();
      expect(auditRecords).toHaveLength(1);
      expect(auditRecords[0]).toEqual(
        expect.objectContaining({
          transactionId: tx_received.id,
          paymentId: tx_received.paymentId,
          fromStatus: WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
          toStatus: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
        }),
      );
    });

    it('should update transaction with safeAddress when provided', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        {
          status: WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
          tariBlockHeight: 12345,
          tariPaymentReference: 'ref-123',
          tariTxTimestamp: 1747209999,
        },
      );

      const dto: TransactionCreatedRequestDTO = {
        walletTransactions: [
          {
            paymentId: transaction.paymentId,
            safeTxHash: 'tx_hash',
            safeNonce: 1,
            safeAddress: '0x1234567890abcdef1234567890abcdef12345678',
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/transaction-created')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual({ success: true });

      const updatedTransaction = await getRepository(
        WrapTokenTransactionEntity,
      ).findOne({ where: { id: transaction.id } });

      expect(updatedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
          safeTxHash: 'tx_hash',
          safeNonce: 1,
          safeAddress: '0x1234567890abcdef1234567890abcdef12345678',
        }),
      );

      const auditRecords = await getRepository(WrapTokenAuditEntity).find();
      expect(auditRecords).toHaveLength(1);
    });

    it('should not be accessible with an incorrect token', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/transaction-created')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer incorect-token`)
        .send({})
        .expect(401);

      expect(body).toEqual({ message: 'Unauthorized', statusCode: 401 });
    });
  });

  describe('PATCH /wrap-token-transactions-m2m/set-error', () => {
    it('should update error field for transactions and create audit records', async () => {
      const [tx1, tx2] = await factory.createMany<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        2,
        [
          { error: [], status: WrapTokenTransactionStatus.CREATED },
          {
            error: [{ code: 'EXISTING_ERROR', message: 'Old error' }],
            status: WrapTokenTransactionStatus.CREATED,
          },
        ],
      );

      const dto: ErrorUpdateRequestDTO = {
        walletTransactions: [
          {
            paymentId: tx1.paymentId,
            error: { code: 'ERR_1', message: 'Test error 1' },
          },
          {
            paymentId: tx2.paymentId,
            error: { code: 'ERR_2', message: 'Test error 2' },
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/set-error')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual({ success: true });

      const updatedTransactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(updatedTransactions).toHaveLength(2);
      expect(updatedTransactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: tx1.id,
            error: [{ code: 'ERR_1', message: 'Test error 1' }],
            status: tx1.status,
          }),
          expect.objectContaining({
            id: tx2.id,
            error: [
              { code: 'EXISTING_ERROR', message: 'Old error' },
              { code: 'ERR_2', message: 'Test error 2' },
            ],
            status: tx2.status,
          }),
        ]),
      );

      const auditRecords = await getRepository(WrapTokenAuditEntity).find();
      expect(auditRecords).toHaveLength(2);

      expect(auditRecords).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            transactionId: tx1.id,
            paymentId: tx1.paymentId,
            fromStatus: WrapTokenTransactionStatus.CREATED,
            toStatus: null,
            note: { code: 'ERR_1', message: 'Test error 1' },
          }),
          expect.objectContaining({
            transactionId: tx2.id,
            paymentId: tx2.paymentId,
            fromStatus: WrapTokenTransactionStatus.CREATED,
            toStatus: null,
            note: { code: 'ERR_2', message: 'Test error 2' },
          }),
        ]),
      );

      expect(
        TransactionEvaluationServiceMock.evaluateErrors,
      ).toHaveBeenCalledTimes(2);
      expect(
        TransactionEvaluationServiceMock.evaluateErrors,
      ).toHaveBeenCalledWith(tx1.id);
      expect(
        TransactionEvaluationServiceMock.evaluateErrors,
      ).toHaveBeenCalledWith(tx2.id);
    });

    it('should not update error field when transaction already has 10 errors', async () => {
      const initialErrors = Array(10)
        .fill(0)
        .map((_, index) => ({
          code: `EXISTING_ERROR_${index}`,
          message: `Error ${index}`,
        }));

      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        {
          error: initialErrors,
          status: WrapTokenTransactionStatus.CREATED,
        },
      );

      const dto: ErrorUpdateRequestDTO = {
        walletTransactions: [
          {
            paymentId: transaction.paymentId,
            error: {
              code: 'NEW_ERROR',
              message: 'This error should not be added',
            },
          },
        ],
      };

      await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/set-error')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      const updatedTransaction = await getRepository(
        WrapTokenTransactionEntity,
      ).findOne({ where: { id: transaction.id } });

      expect(updatedTransaction?.error).toHaveLength(10);
      expect(updatedTransaction?.error).toEqual(initialErrors);

      const auditRecords = await getRepository(WrapTokenAuditEntity).find({
        where: { transactionId: transaction.id },
      });
      expect(auditRecords).toHaveLength(0);

      expect(
        TransactionEvaluationServiceMock.evaluateErrors,
      ).not.toHaveBeenCalled();
    });

    it('should not be accessible with an incorrect token', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/set-error')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer incorect-token`)
        .send({})
        .expect(401);

      expect(body).toEqual({ message: 'Unauthorized', statusCode: 401 });
    });
  });

  describe('PATCH /wrap-token-transactions-m2m/executing-transaction', () => {
    it('should update transactions status to EXECUTING_SAFE_TRANSACTION and create audit records', async () => {
      const [tx_created_1, tx_created_2] =
        await factory.createMany<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,

          [
            {
              status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
              safeTxHash: 'hash123',
              tariPaymentReference: 'ref123',
              tariBlockHeight: 100,
              tariTxTimestamp: 123,
            },
            {
              status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
              safeTxHash: 'hash456',
              tariPaymentReference: 'ref222',
              tariBlockHeight: 200,
              tariTxTimestamp: 223,
            },
          ],
        );

      const dto: ExecutingTransactionRequestDTO = {
        walletTransactions: [
          {
            paymentId: tx_created_1.paymentId,
          },
          {
            paymentId: tx_created_2.paymentId,
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/executing-transaction')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual({ success: true });

      const updatedTransactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(updatedTransactions).toHaveLength(2);
      expect(updatedTransactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: tx_created_1.id,
            status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
            safeTxHash: 'hash123',
          }),
          expect.objectContaining({
            id: tx_created_2.id,
            status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
            safeTxHash: 'hash456',
          }),
        ]),
      );

      const auditRecords = await getRepository(WrapTokenAuditEntity).find();
      expect(auditRecords).toHaveLength(2);
      expect(auditRecords).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            transactionId: tx_created_1.id,
            paymentId: tx_created_1.paymentId,
            fromStatus: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
            toStatus: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
          }),
          expect.objectContaining({
            transactionId: tx_created_2.id,
            paymentId: tx_created_2.paymentId,
            fromStatus: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
            toStatus: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
          }),
        ]),
      );
    });

    it('should update transactions status, and throw an exception if some transactions cannot be found', async () => {
      const [tx_created, tx_other_status] =
        await factory.createMany<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          [
            {
              status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
              safeTxHash: 'hash123',
              tariPaymentReference: 'ref123',
              tariBlockHeight: 100,
              tariTxTimestamp: 123,
            },
            {
              status: WrapTokenTransactionStatus.CREATED,
              safeTxHash: 'hash456',
            },
          ],
        );

      const dto: ExecutingTransactionRequestDTO = {
        walletTransactions: [
          {
            paymentId: tx_created.paymentId,
          },
          {
            paymentId: tx_other_status.paymentId,
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/executing-transaction')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(400);

      expect(body).toEqual({
        error: 'Bad Request',
        message: `Transaction with paymentId ${tx_other_status.paymentId} not found`,
        statusCode: 400,
      });

      const updatedTransactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(updatedTransactions).toHaveLength(2);
      expect(updatedTransactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: tx_created.id,
            status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
            safeTxHash: 'hash123',
          }),
          expect.objectContaining({
            id: tx_other_status.id,
            status: WrapTokenTransactionStatus.CREATED,
            safeTxHash: 'hash456',
          }),
        ]),
      );

      const auditRecords = await getRepository(WrapTokenAuditEntity).find();
      expect(auditRecords).toHaveLength(1);
      expect(auditRecords[0]).toEqual(
        expect.objectContaining({
          transactionId: tx_created.id,
          paymentId: tx_created.paymentId,
          fromStatus: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
          toStatus: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
        }),
      );
    });

    it('should not be accessible with an incorrect token', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/executing-transaction')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer incorect-token`)
        .send({})
        .expect(401);

      expect(body).toEqual({ message: 'Unauthorized', statusCode: 401 });
    });
  });

  describe('PATCH /wrap-token-transactions-m2m/transaction-executed', () => {
    it('should update transactions status to SAFE_TRANSACTION_EXECUTED, and throw an exception if some transactions cannot be found', async () => {
      const [tx_executing, tx_other_status] =
        await factory.createMany<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,

          [
            {
              status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
              safeTxHash: 'hash123',
              tariPaymentReference: 'ref123',
              tariBlockHeight: 100,
              tariTxTimestamp: 123,
            },
            {
              status: WrapTokenTransactionStatus.CREATED,
              tariPaymentIdHex: '123',
              safeTxHash: 'hash456',
            },
          ],
        );

      const dto: TransactionExecutedRequestDTO = {
        walletTransactions: [
          {
            paymentId: tx_executing.paymentId,
          },
          {
            paymentId: tx_other_status.paymentId,
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/transaction-executed')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(400);

      expect(body).toEqual({
        error: 'Bad Request',
        message: `Transaction with paymentId ${tx_other_status.paymentId} not found`,
        statusCode: 400,
      });

      const updatedTransactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(updatedTransactions).toHaveLength(2);
      expect(updatedTransactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: tx_executing.id,
            status: WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED,
            safeTxHash: 'hash123',
            transactionHash: null,
          }),
          expect.objectContaining({
            id: tx_other_status.id,
            status: WrapTokenTransactionStatus.CREATED,
            safeTxHash: 'hash456',
            transactionHash: null,
          }),
        ]),
      );

      const auditRecords = await getRepository(WrapTokenAuditEntity).find();
      expect(auditRecords).toHaveLength(1);
      expect(auditRecords[0]).toEqual(
        expect.objectContaining({
          transactionId: tx_executing.id,
          paymentId: tx_executing.paymentId,
          fromStatus: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
          toStatus: WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED,
        }),
      );
    });

    it('should update transactions status to SAFE_TRANSACTION_EXECUTED and save trasaction hash', async () => {
      const [tx_executing, tx_executing_2] =
        await factory.createMany<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          2,
          [
            {
              status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
              safeTxHash: 'hash123',
              tariPaymentReference: 'ref123',
              tariBlockHeight: 100,
              tariTxTimestamp: 123,
            },
            {
              status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
              safeTxHash: 'hash456',
              tariPaymentReference: 'ref123',
              tariBlockHeight: 100,
              tariTxTimestamp: 123,
            },
          ],
        );

      const dto: TransactionExecutedRequestDTO = {
        walletTransactions: [
          {
            paymentId: tx_executing.paymentId,
            transactionHash: 'tx_hash_123',
          },
          {
            paymentId: tx_executing_2.paymentId,
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/transaction-executed')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual({ success: true });

      const updatedTransactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(updatedTransactions).toHaveLength(2);
      expect(updatedTransactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: tx_executing.id,
            status: WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED,
            safeTxHash: 'hash123',
            transactionHash: 'tx_hash_123',
          }),
          expect.objectContaining({
            id: tx_executing_2.id,
            status: WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED,
            safeTxHash: 'hash456',
            transactionHash: null,
          }),
        ]),
      );

      const auditRecords = await getRepository(WrapTokenAuditEntity).find();
      expect(auditRecords).toHaveLength(2);
    });

    it('should not be accessible with an incorrect token', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/transaction-executed')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer incorect-token`)
        .send({})
        .expect(401);

      expect(body).toEqual({ message: 'Unauthorized', statusCode: 401 });
    });
  });
});
