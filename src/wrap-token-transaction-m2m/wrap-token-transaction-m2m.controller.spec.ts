import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 as uuidV4 } from 'uuid';

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
} from './wrap-token-transaction-m2m.dto';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { M2MAuthModule } from '../m2m-auth/m2m-auth.module';

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
    it('should update transactions status to TOKENS_RECEIVED', async () => {
      const [tx_created, tx_token_sent, tx_with_tari_tx_id, tx_other_uuid] =
        await factory.createMany<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          4,
          [
            { status: WrapTokenTransactionStatus.CREATED, tokenAmount: '1000' },
            {
              status: WrapTokenTransactionStatus.TOKENS_SENT,
              tokenAmount: '1000',
            },
            {
              status: WrapTokenTransactionStatus.TOKENS_SENT,
              tokenAmount: '1000',
              tariTxId: '1',
            },
            { status: WrapTokenTransactionStatus.CREATED, tokenAmount: '1000' },
          ],
        );

      const dto: TokensReceivedRequestDTO = {
        wallelTransactions: [
          {
            paymentId: tx_created.paymentId,
            txId: '1',
            amount: '1',
            timestamp: '1747209840',
          },
          {
            paymentId: tx_token_sent.paymentId,
            txId: '2',
            amount: '2',
            timestamp: '1747209840',
          },
          {
            paymentId: tx_with_tari_tx_id.paymentId,
            txId: '3',
            amount: '3',
            timestamp: '1747209840',
          },
          {
            paymentId: uuidV4(),
            txId: '4',
            amount: '4',
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
            tariTxId: '1',
            tokenAmount: '1',
            tariTxTimestamp: 1747209840,
          }),
          expect.objectContaining({
            id: tx_token_sent.id,
            status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
            tariTxId: '2',
            tokenAmount: '2',
            tariTxTimestamp: 1747209840,
          }),
          expect.objectContaining({
            id: tx_with_tari_tx_id.id,
            status: WrapTokenTransactionStatus.TOKENS_SENT,
            tariTxId: '1',
            tokenAmount: '1000',
            tariTxTimestamp: null,
          }),
          expect.objectContaining({
            id: tx_other_uuid.id,
            status: WrapTokenTransactionStatus.CREATED,
            tariTxId: null,
            tokenAmount: '1000',
            tariTxTimestamp: null,
          }),
        ]),
      );
    });

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
    it('should update transactions status to SAFE_TRANSACTION_CREATING', async () => {
      const [tx_received, tx_other_status, tx_no_tari_tx_id] =
        await factory.createMany<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          3,
          [
            {
              status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
              tariTxId: '123',
            },
            {
              status: WrapTokenTransactionStatus.CREATED,
              tariTxId: '123',
            },
            {
              status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
              tariTxId: undefined,
            },
          ],
        );

      const dto: CreatingTransactionRequestDTO = {
        wallelTransactions: [
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
    it('should update transactions status to SAFE_TRANSACTION_CREATED', async () => {
      const [tx_received, tx_other_status, tx_no_tari_tx_id] =
        await factory.createMany<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          3,
          [
            {
              status: WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
              tariTxId: '123',
            },
            {
              status: WrapTokenTransactionStatus.CREATED,
              tariTxId: '123',
            },
            {
              status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
              tariTxId: undefined,
            },
          ],
        );

      const dto: TransactionCreatedRequestDTO = {
        wallelTransactions: [
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
    it('should update error field for transactions', async () => {
      const [tx1, tx2] = await factory.createMany<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        2,
      );

      const dto: ErrorUpdateRequestDTO = {
        wallelTransactions: [
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
            status: WrapTokenTransactionStatus.UNPROCESSABLE,
          }),
          expect.objectContaining({
            id: tx2.id,
            error: { code: 'ERR_2', message: 'Test error 2' },
            status: WrapTokenTransactionStatus.UNPROCESSABLE,
          }),
        ]),
      );
    });
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
