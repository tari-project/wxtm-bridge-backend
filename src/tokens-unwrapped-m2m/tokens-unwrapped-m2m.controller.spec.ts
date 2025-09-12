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
import { TokensUnwrappedM2MModule } from './tokens-unwrapped-m2m.module';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { M2MAuthModule } from '../m2m-auth/m2m-auth.module';
import {
  TokensUnwrappedSetErrorDTO,
  UpdateTokensUnwrappedStatusDTO,
  UpdateSendingTokensDTO,
  UpdateToTokensSentDTO,
} from './tokens-unwrapped-m2m.dto';
import { TokensUnwrappedStatus } from '../tokens-unwrapped/tokens-unwrapped.const';
import { TransactionEvaluationServiceMock } from '../../test/mocks/transaction-evaluation.service.mock';
import { TransactionEvaluationService } from '../transaction-evaluation/transaction-evaluation.service';
import { SettingsEntity } from '../settings/settings.entity';
import { TokensUnwrappedAuditEntity } from '../tokens-unwrapped-audit/tokens-unwrapped-audit.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsServiceMock } from '../../test/mocks/notifications.service.mock';

describe('TokensUnwrappedM2MController', () => {
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
              domain: 'example.com',
            }),
          ],
          isGlobal: true,
        }),
        TestDatabaseModule,
        M2MAuthModule.register({ authToken: m2mToken }),
        TokensUnwrappedM2MModule,
      ],
    })
      .overrideProvider(TransactionEvaluationService)
      .useValue(TransactionEvaluationServiceMock)
      .overrideProvider(NotificationsService)
      .useValue(NotificationsServiceMock)
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

  describe('GET /tokens-unwrapped-m2m', () => {
    it('returns all transactions with valid M2M auth token', async () => {
      await factory.createMany<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        3,
      );

      const { body } = await request(app.getHttpServer())
        .get('/tokens-unwrapped-m2m')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .expect(200);

      expect(body).toHaveLength(3);
    });

    it('returns 401 with invalid M2M auth token', async () => {
      await request(app.getHttpServer())
        .get('/tokens-unwrapped-m2m')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /tokens-unwrapped-m2m/:id', () => {
    it('returns a specific transaction with valid M2M auth token', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
      );

      const { body } = await request(app.getHttpServer())
        .get(`/tokens-unwrapped-m2m/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .expect(200);

      expect(body.id).toBe(transaction.id);
    });

    it('returns 401 with incorrect M2M auth token', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
      );

      await request(app.getHttpServer())
        .get(`/tokens-unwrapped-m2m/${transaction.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('PATCH /tokens-unwrapped-m2m/awaiting-confirmation', () => {
    it('returns 401 with invalid M2M auth token', async () => {
      await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/awaiting-confirmation')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer invalid-token')
        .send({})
        .expect(401);
    });

    it('updates transaction from CREATED to AWAITING_CONFIRMATION', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        {
          status: TokensUnwrappedStatus.CREATED,
        },
      );

      const dto: UpdateTokensUnwrappedStatusDTO = {
        paymentId: transaction.paymentId,
      };

      const { body } = await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/awaiting-confirmation')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual({ success: true });

      const updatedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({
        where: { id: transaction.id },
      });

      expect(updatedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          paymentId: transaction.paymentId,
          status: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
        }),
      );
    });

    it('does not update transaction if status is not CREATED', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        {
          status: TokensUnwrappedStatus.CONFIRMED_AWAITING_APPROVAL,
        },
      );

      const dto: UpdateTokensUnwrappedStatusDTO = {
        paymentId: transaction.paymentId,
      };

      const { body } = await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/awaiting-confirmation')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(400);

      expect(body).toEqual({
        error: 'Bad Request',
        message: `Transaction with paymentId ${transaction.paymentId} not found`,
        statusCode: 400,
      });

      const unchangedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({
        where: { id: transaction.id },
      });

      expect(unchangedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          paymentId: transaction.paymentId,
          status: TokensUnwrappedStatus.CONFIRMED_AWAITING_APPROVAL,
        }),
      );
    });
  });

  describe('PATCH /tokens-unwrapped-m2m/confirmed', () => {
    it('returns 401 with invalid M2M auth token', async () => {
      await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/confirmed')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer invalid-token')
        .send({})
        .expect(401);
    });

    it('updates transaction from AWAITING_CONFIRMATION to CONFIRMED', async () => {
      await factory.create<SettingsEntity>(SettingsEntity.name, {
        unwrapManualApprovalThreshold: '100',
      });

      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        {
          status: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
          amountAfterFee: '99',
        },
      );

      const dto: UpdateTokensUnwrappedStatusDTO = {
        paymentId: transaction.paymentId,
      };

      const { body } = await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/confirmed')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual({ success: true });

      const updatedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({
        where: { id: transaction.id },
      });

      expect(updatedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          paymentId: transaction.paymentId,
          status: TokensUnwrappedStatus.CONFIRMED,
        }),
      );

      expect(
        NotificationsServiceMock.sendTokensUnwrappedRequiresApprovalNotification,
      ).not.toHaveBeenCalled();

      const auditRecords = await getRepository(
        TokensUnwrappedAuditEntity,
      ).find();
      expect(auditRecords).toHaveLength(1);

      expect(auditRecords[0]).toMatchObject({
        transactionId: updatedTransaction?.id,
        paymentId: updatedTransaction?.paymentId,
        fromStatus: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
        toStatus: TokensUnwrappedStatus.CONFIRMED,
      });
    });

    it('updates transaction from AWAITING_CONFIRMATION to CONFIRMED_AWAITING_APPROVAL when amountAfterFee exceeds the manual approval threshold', async () => {
      await factory.create<SettingsEntity>(SettingsEntity.name, {
        unwrapManualApprovalThreshold: '100',
      });

      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        {
          status: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
          amountAfterFee: '100',
        },
      );

      const dto: UpdateTokensUnwrappedStatusDTO = {
        paymentId: transaction.paymentId,
      };

      const { body } = await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/confirmed')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual({ success: true });

      const updatedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({
        where: { id: transaction.id },
      });

      expect(updatedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          paymentId: transaction.paymentId,
          status: TokensUnwrappedStatus.CONFIRMED_AWAITING_APPROVAL,
        }),
      );

      expect(
        NotificationsServiceMock.sendTokensUnwrappedRequiresApprovalNotification,
      ).toHaveBeenCalledWith(transaction.id);

      const auditRecords = await getRepository(
        TokensUnwrappedAuditEntity,
      ).find();
      expect(auditRecords).toHaveLength(1);

      expect(auditRecords[0]).toMatchObject({
        transactionId: updatedTransaction?.id,
        paymentId: updatedTransaction?.paymentId,
        fromStatus: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
        toStatus: TokensUnwrappedStatus.CONFIRMED_AWAITING_APPROVAL,
      });
    });

    it('does not update transaction if status is not AWAITING_CONFIRMATION', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        {
          status: TokensUnwrappedStatus.CREATED,
        },
      );

      const dto: UpdateTokensUnwrappedStatusDTO = {
        paymentId: transaction.paymentId,
      };

      const { body } = await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/confirmed')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(400);

      expect(body).toEqual({
        error: 'Bad Request',
        message: `Transaction with paymentId ${transaction.paymentId} not found`,
        statusCode: 400,
      });

      const unchangedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({
        where: { id: transaction.id },
      });

      expect(unchangedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          paymentId: transaction.paymentId,
          status: TokensUnwrappedStatus.CREATED,
        }),
      );
    });
  });

  describe('PATCH /tokens-unwrapped-m2m/init-send-tokens', () => {
    it('returns 401 with invalid M2M auth token', async () => {
      await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/init-send-tokens')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer invalid-token')
        .send({})
        .expect(401);
    });

    it('updates transaction from CONFIRMED to INIT_SEND_TOKENS', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        {
          status: TokensUnwrappedStatus.CONFIRMED,
        },
      );

      const dto: UpdateTokensUnwrappedStatusDTO = {
        paymentId: transaction.paymentId,
      };

      const { body } = await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/init-send-tokens')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual({ success: true });

      const updatedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({
        where: { id: transaction.id },
      });

      expect(updatedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          paymentId: transaction.paymentId,
          status: TokensUnwrappedStatus.INIT_SEND_TOKENS,
        }),
      );

      const auditRecords = await getRepository(
        TokensUnwrappedAuditEntity,
      ).find();
      expect(auditRecords).toHaveLength(1);

      expect(auditRecords[0]).toMatchObject({
        transactionId: updatedTransaction?.id,
        paymentId: updatedTransaction?.paymentId,
        fromStatus: TokensUnwrappedStatus.CONFIRMED,
        toStatus: TokensUnwrappedStatus.INIT_SEND_TOKENS,
      });
    });

    it('does not update transaction if status is not CONFIRMED', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        {
          status: TokensUnwrappedStatus.CREATED,
        },
      );

      const dto: UpdateTokensUnwrappedStatusDTO = {
        paymentId: transaction.paymentId,
      };

      const { body } = await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/init-send-tokens')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(400);

      expect(body).toEqual({
        error: 'Bad Request',
        message: `Transaction with paymentId ${transaction.paymentId} not found`,
        statusCode: 400,
      });

      const unchangedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({
        where: { id: transaction.id },
      });

      expect(unchangedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          paymentId: transaction.paymentId,
          status: TokensUnwrappedStatus.CREATED,
        }),
      );
    });
  });

  describe('PATCH /tokens-unwrapped-m2m/sending-tokens', () => {
    it('returns 401 with invalid M2M auth token', async () => {
      await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/sending-tokens')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer invalid-token')
        .send({})
        .expect(401);
    });

    it('updates transaction from INIT_SEND_TOKENS to SENDING_TOKENS with temporaryTransactionId', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        {
          status: TokensUnwrappedStatus.INIT_SEND_TOKENS,
        },
      );

      const dto: UpdateSendingTokensDTO = {
        paymentId: transaction.paymentId,
        temporaryTransactionId: '12345',
      };

      const { body } = await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/sending-tokens')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual({ success: true });

      const updatedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({
        where: { id: transaction.id },
      });

      expect(updatedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          paymentId: transaction.paymentId,
          status: TokensUnwrappedStatus.SENDING_TOKENS,
          temporaryTransactionId: '12345',
        }),
      );

      const auditRecords = await getRepository(
        TokensUnwrappedAuditEntity,
      ).find();
      expect(auditRecords).toHaveLength(1);

      expect(auditRecords[0]).toMatchObject({
        transactionId: updatedTransaction?.id,
        paymentId: updatedTransaction?.paymentId,
        fromStatus: TokensUnwrappedStatus.INIT_SEND_TOKENS,
        toStatus: TokensUnwrappedStatus.SENDING_TOKENS,
      });
    });

    it('does not update transaction if status is not INIT_SEND_TOKENS', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        {
          status: TokensUnwrappedStatus.CONFIRMED,
        },
      );

      const dto: UpdateSendingTokensDTO = {
        paymentId: transaction.paymentId,
        temporaryTransactionId: '12345',
      };

      const { body } = await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/sending-tokens')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(400);

      expect(body).toEqual({
        error: 'Bad Request',
        message: `Transaction with paymentId ${transaction.paymentId} not found`,
        statusCode: 400,
      });

      const unchangedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({
        where: { id: transaction.id },
      });

      expect(unchangedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          paymentId: transaction.paymentId,
          status: TokensUnwrappedStatus.CONFIRMED,
          temporaryTransactionId: null,
        }),
      );
    });

    it('update transaction even if temporaryTransactionId is already set', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        {
          status: TokensUnwrappedStatus.INIT_SEND_TOKENS,
          temporaryTransactionId: 'existing-id',
        },
      );

      const dto: UpdateSendingTokensDTO = {
        paymentId: transaction.paymentId,
        temporaryTransactionId: '12345',
      };

      const { body } = await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/sending-tokens')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual({ success: true });

      const updatedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({
        where: { id: transaction.id },
      });

      expect(updatedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          paymentId: transaction.paymentId,
          status: TokensUnwrappedStatus.SENDING_TOKENS,
          temporaryTransactionId: '12345',
        }),
      );

      const auditRecords = await getRepository(
        TokensUnwrappedAuditEntity,
      ).find();
      expect(auditRecords).toHaveLength(1);
    });
  });

  describe('PATCH /tokens-unwrapped-m2m/tokens-sent', () => {
    it('returns 401 with invalid M2M auth token', async () => {
      await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/tokens-sent')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer invalid-token')
        .send({})
        .expect(401);
    });

    it('updates transaction from SENDING_TOKENS to TOKENS_SENT with Tari transaction details', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        {
          status: TokensUnwrappedStatus.SENDING_TOKENS,
          temporaryTransactionId: '12345',
        },
      );

      const dto: UpdateToTokensSentDTO = {
        paymentId: transaction.paymentId,
        tariTxTimestamp: 1630000000,
        tariBlockHeight: 123456,
        tariPaymentReference: 'tari-payment-ref-123',
      };

      const { body } = await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/tokens-sent')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual({ success: true });

      const updatedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({
        where: { id: transaction.id },
      });

      expect(updatedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          paymentId: transaction.paymentId,
          status: TokensUnwrappedStatus.TOKENS_SENT,
          temporaryTransactionId: 'n/a',
          tariTxTimestamp: 1630000000,
          tariBlockHeight: 123456,
          tariPaymentReference: 'tari-payment-ref-123',
        }),
      );

      const auditRecords = await getRepository(
        TokensUnwrappedAuditEntity,
      ).find();
      expect(auditRecords).toHaveLength(1);

      expect(auditRecords[0]).toMatchObject({
        transactionId: updatedTransaction?.id,
        paymentId: updatedTransaction?.paymentId,
        fromStatus: TokensUnwrappedStatus.SENDING_TOKENS,
        toStatus: TokensUnwrappedStatus.TOKENS_SENT,
      });
    });

    it('does not update transaction if status is not SENDING_TOKENS', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        {
          status: TokensUnwrappedStatus.CONFIRMED,
        },
      );

      const dto: UpdateToTokensSentDTO = {
        paymentId: transaction.paymentId,
        tariTxTimestamp: 1630000000,
        tariBlockHeight: 123456,
        tariPaymentReference: 'tari-payment-ref-123',
      };

      const { body } = await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/tokens-sent')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(400);

      expect(body).toEqual({
        error: 'Bad Request',
        message: `Transaction with paymentId ${transaction.paymentId} not found`,
        statusCode: 400,
      });

      const unchangedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({
        where: { id: transaction.id },
      });

      expect(unchangedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          paymentId: transaction.paymentId,
          status: TokensUnwrappedStatus.CONFIRMED,
        }),
      );
    });
  });

  describe('PATCH /tokens-unwrapped-m2m/set-error', () => {
    it('returns 401 with invalid M2M auth token', async () => {
      await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/set-error')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer invalid-token')
        .send({})
        .expect(401);
    });

    it('updates error field for transaction and evaluates errors', async () => {
      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        {
          error: [],
        },
      );

      const dto: TokensUnwrappedSetErrorDTO = {
        paymentId: transaction.paymentId,
        error: { code: 'TEST_ERROR', message: 'Test error message' },
      };

      const { body } = await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/set-error')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual({ success: true });

      const updatedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({
        where: { id: transaction.id },
      });

      expect(updatedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          paymentId: transaction.paymentId,
          error: [{ code: 'TEST_ERROR', message: 'Test error message' }],
        }),
      );

      expect(
        TransactionEvaluationServiceMock.evaluateTokensUnwrappedErrors,
      ).toHaveBeenCalledWith(transaction.id);
    });

    it('should not update error field when transaction already has 10 errors', async () => {
      const initialErrors = Array(10)
        .fill(0)
        .map((_, index) => ({
          code: `EXISTING_ERROR_${index}`,
          message: `Error ${index}`,
        }));

      const transaction = await factory.create<TokensUnwrappedEntity>(
        TokensUnwrappedEntity.name,
        {
          error: initialErrors,
        },
      );

      const dto: TokensUnwrappedSetErrorDTO = {
        paymentId: transaction.paymentId,
        error: { code: 'NEW_ERROR', message: 'This error should not be added' },
      };

      await request(app.getHttpServer())
        .patch('/tokens-unwrapped-m2m/set-error')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(200);

      const updatedTransaction = await getRepository(
        TokensUnwrappedEntity,
      ).findOne({
        where: { id: transaction.id },
      });

      expect(updatedTransaction?.error).toHaveLength(10);
      expect(updatedTransaction?.error).toEqual(initialErrors);

      expect(
        TransactionEvaluationServiceMock.evaluateTokensUnwrappedErrors,
      ).not.toHaveBeenCalled();
    });
  });
});
