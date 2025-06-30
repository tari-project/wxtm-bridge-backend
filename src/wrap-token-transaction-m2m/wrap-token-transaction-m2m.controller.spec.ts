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
  TokensReceivedRequestDTO,
  ErrorUpdateRequestDTO,
  CreatingTransactionRequestDTO,
  TransactionCreatedRequestDTO,
  ExecutingTransactionRequestDTO,
  TransactionExecutedRequestDTO,
} from './wrap-token-transaction-m2m.dto';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { M2MAuthModule } from '../m2m-auth/m2m-auth.module';
import { WrapTokenAuditEntity } from '../wrap-token-audit/wrap-token-audit.entity';

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
    it('should update transactions status to TOKENS_RECEIVED and create audit records', async () => {
      const [
        tx_created,
        tx_token_sent,
        tx_timeout,
        tx_tokens_send_amount_mismatch,
      ] = await factory.createMany<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        4,
        [
          { status: WrapTokenTransactionStatus.CREATED, tokenAmount: '1000' },
          {
            status: WrapTokenTransactionStatus.TOKENS_SENT,
            tokenAmount: '1000',
          },
          {
            status: WrapTokenTransactionStatus.TIMEOUT,
            tokenAmount: '1000',
          },
          {
            status: WrapTokenTransactionStatus.TOKENS_SENT,
            tokenAmount: '1000',
          },
        ],
      );

      const dto: TokensReceivedRequestDTO = {
        walletTransactions: [
          {
            paymentId: tx_created.paymentId,
            tariPaymentIdHex: '1',
            amount: '1000',
            timestamp: '1747209840',
          },
          {
            paymentId: tx_token_sent.paymentId,
            tariPaymentIdHex: '2',
            amount: '1000',
            timestamp: '1747209840',
          },
          {
            paymentId: tx_timeout.paymentId,
            tariPaymentIdHex: '3',
            amount: '1000',
            timestamp: '1747209840',
          },
          {
            paymentId: tx_tokens_send_amount_mismatch.paymentId,
            tariPaymentIdHex: '4',
            amount: '3000',
            timestamp: '1747209840',
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

      expect(updatedTransactions).toHaveLength(4);
      expect(updatedTransactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: tx_created.id,
            status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
            tariPaymentIdHex: '1',
            tokenAmount: '1000',
            tokenAmountInWallet: '1000',
            tariTxTimestamp: 1747209840,
          }),
          expect.objectContaining({
            id: tx_token_sent.id,
            status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
            tariPaymentIdHex: '2',
            tokenAmount: '1000',
            tokenAmountInWallet: '1000',
            tariTxTimestamp: 1747209840,
          }),
          expect.objectContaining({
            id: tx_timeout.id,
            status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
            tariPaymentIdHex: '3',
            tokenAmount: '1000',
            tokenAmountInWallet: '1000',
            tariTxTimestamp: 1747209840,
          }),
          expect.objectContaining({
            id: tx_tokens_send_amount_mismatch.id,
            status: WrapTokenTransactionStatus.TOKENS_RECEIVED_WITH_MISMATCH,
            tariPaymentIdHex: '4',
            tokenAmount: '1000',
            tokenAmountInWallet: '3000',
            tariTxTimestamp: 1747209840,
          }),
        ]),
      );

      const auditRecords = await getRepository(WrapTokenAuditEntity).find({
        order: { createdAt: 'ASC' },
      });

      expect(auditRecords).toHaveLength(4);
      expect(auditRecords).toEqual([
        expect.objectContaining({
          transactionId: tx_created.id,
          paymentId: tx_created.paymentId,
          fromStatus: WrapTokenTransactionStatus.CREATED,
          toStatus: WrapTokenTransactionStatus.TOKENS_RECEIVED,
        }),
        expect.objectContaining({
          transactionId: tx_token_sent.id,
          paymentId: tx_token_sent.paymentId,
          fromStatus: WrapTokenTransactionStatus.TOKENS_SENT,
          toStatus: WrapTokenTransactionStatus.TOKENS_RECEIVED,
        }),
        expect.objectContaining({
          transactionId: tx_timeout.id,
          paymentId: tx_timeout.paymentId,
          fromStatus: WrapTokenTransactionStatus.TIMEOUT,
          toStatus: WrapTokenTransactionStatus.TOKENS_RECEIVED,
        }),
        expect.objectContaining({
          transactionId: tx_tokens_send_amount_mismatch.id,
          paymentId: tx_tokens_send_amount_mismatch.paymentId,
          fromStatus: WrapTokenTransactionStatus.TOKENS_SENT,
          toStatus: WrapTokenTransactionStatus.TOKENS_RECEIVED_WITH_MISMATCH,
        }),
      ]);
    });

    it.each([
      [
        WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
        'not in valid statuses',
      ],
      [
        WrapTokenTransactionStatus.TOKENS_RECEIVED,
        'already in tokens received status',
      ],
      [
        WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED,
        'already completed',
      ],
      [
        WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
        'already executing',
      ],
    ])(
      'should not update transaction when status is %s (%s)',
      async (status, _description) => {
        const transaction = await factory.create<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          {
            status,
            tariPaymentIdHex: null as unknown as undefined,
            tariTxTimestamp: null as unknown as undefined,
          },
        );

        const dto: TokensReceivedRequestDTO = {
          walletTransactions: [
            {
              paymentId: transaction.paymentId,
              tariPaymentIdHex: 'new-tari-id',
              amount: '1000',
              timestamp: '1747209999',
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
            tariPaymentIdHex: null,
            tariTxTimestamp: null,
            tokenAmountInWallet: null,
          }),
        );
      },
    );

    it('should not be accessible with an incorrect token', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/tokens-received')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer incorect-token`)
        .send({})
        .expect(401);

      expect(body).toEqual({ message: 'Unauthorized', statusCode: 401 });
    });
  });

  describe('PATCH /wrap-token-transactions-m2m/creating-transaction', () => {
    it('should update transactions status to SAFE_TRANSACTION_CREATING and create audit records', async () => {
      const [tx_received, tx_other_status, tx_no_tari_tx_id] =
        await factory.createMany<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          3,
          [
            {
              status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
              tariPaymentIdHex: '123',
            },
            {
              status: WrapTokenTransactionStatus.CREATED,
              tariPaymentIdHex: '123',
            },
            {
              status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
              tariPaymentIdHex: undefined,
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
          {
            paymentId: tx_no_tari_tx_id.paymentId,
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .patch('/wrap-token-transactions-m2m/creating-transaction')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual({ success: true });

      const updatedTransactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(updatedTransactions).toHaveLength(3);
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
          expect.objectContaining({
            id: tx_no_tari_tx_id.id,
            status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
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
      const [tx_received, tx_other_status, tx_no_tari_tx_id] =
        await factory.createMany<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          3,
          [
            {
              status: WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
              tariPaymentIdHex: '123',
            },
            {
              status: WrapTokenTransactionStatus.CREATED,
              tariPaymentIdHex: '123',
            },
            {
              status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
              tariPaymentIdHex: undefined,
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
          {
            paymentId: tx_no_tari_tx_id.paymentId,
            safeTxHash: 'tx_3_hash',
            safeNonce: 3,
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

      const updatedTransactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(updatedTransactions).toHaveLength(3);
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
          expect.objectContaining({
            id: tx_no_tari_tx_id.id,
            status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
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
          tariPaymentIdHex: '123',
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
          {},
          {
            error: { code: 'EXISTING_ERROR' },
            status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
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
            error: { code: 'ERR_1', message: 'Test error 1' },
            status: tx1.status,
          }),
          expect.objectContaining({
            id: tx2.id,
            error: { code: 'EXISTING_ERROR' },
            status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
          }),
        ]),
      );

      const auditRecords = await getRepository(WrapTokenAuditEntity).find();
      expect(auditRecords).toHaveLength(1);
      expect(auditRecords).toEqual([
        expect.objectContaining({
          transactionId: tx1.id,
          paymentId: tx1.paymentId,
          fromStatus: WrapTokenTransactionStatus.CREATED,
          toStatus: null,
          note: { code: 'ERR_1', message: 'Test error 1' },
        }),
      ]);
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
      const [tx_created, tx_other_status, tx_no_safe_tx_hash] =
        await factory.createMany<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          3,
          [
            {
              status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
              tariPaymentIdHex: '123',
              safeTxHash: 'hash123',
            },
            {
              status: WrapTokenTransactionStatus.CREATED,
              tariPaymentIdHex: '123',
              safeTxHash: 'hash456',
            },
            {
              status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
              tariPaymentIdHex: '123',
              safeTxHash: undefined,
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
          {
            paymentId: tx_no_safe_tx_hash.paymentId,
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

      expect(updatedTransactions).toHaveLength(3);
      expect(updatedTransactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: tx_created.id,
            status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
            tariPaymentIdHex: '123',
            safeTxHash: 'hash123',
          }),
          expect.objectContaining({
            id: tx_other_status.id,
            status: WrapTokenTransactionStatus.CREATED,
            tariPaymentIdHex: '123',
            safeTxHash: 'hash456',
          }),
          expect.objectContaining({
            id: tx_no_safe_tx_hash.id,
            status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
            tariPaymentIdHex: '123',
            safeTxHash: null,
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
    it('should update transactions status to SAFE_TRANSACTION_EXECUTED and create audit records', async () => {
      const [tx_executing, tx_other_status, tx_no_safe_tx_hash] =
        await factory.createMany<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          3,
          [
            {
              status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
              tariPaymentIdHex: '123',
              safeTxHash: 'hash123',
            },
            {
              status: WrapTokenTransactionStatus.CREATED,
              tariPaymentIdHex: '123',
              safeTxHash: 'hash456',
            },
            {
              status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
              tariPaymentIdHex: '123',
              safeTxHash: undefined,
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
          {
            paymentId: tx_no_safe_tx_hash.paymentId,
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

      expect(updatedTransactions).toHaveLength(3);
      expect(updatedTransactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: tx_executing.id,
            status: WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED,
            tariPaymentIdHex: '123',
            safeTxHash: 'hash123',
            transactionHash: null,
          }),
          expect.objectContaining({
            id: tx_other_status.id,
            status: WrapTokenTransactionStatus.CREATED,
            tariPaymentIdHex: '123',
            safeTxHash: 'hash456',
            transactionHash: null,
          }),
          expect.objectContaining({
            id: tx_no_safe_tx_hash.id,
            status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
            tariPaymentIdHex: '123',
            safeTxHash: null,
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
              tariPaymentIdHex: '123',
              safeTxHash: 'hash123',
            },
            {
              status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
              tariPaymentIdHex: '123',
              safeTxHash: 'hash456',
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
            tariPaymentIdHex: '123',
            safeTxHash: 'hash123',
            transactionHash: 'tx_hash_123',
          }),
          expect.objectContaining({
            id: tx_executing_2.id,
            status: WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED,
            tariPaymentIdHex: '123',
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
