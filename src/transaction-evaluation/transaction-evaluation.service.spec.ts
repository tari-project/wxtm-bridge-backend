import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import config from '../config/config';
import {
  TestDatabaseModule,
  initializeDatabase,
  clearDatabase,
  getRepository,
} from '../../test/database';
import { Factory, getFactory } from '../../test/factory/factory';
import { TransactionEvaluationService } from './transaction-evaluation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsServiceMock } from '../../test/mocks/notifications.service.mock';
import { TransactionEvaluationModule } from './transaction-evaluation.module';
import { TokensUnwrappedAuditService } from '../tokens-unwrapped-audit/tokens-unwrapped-audit.service';
import { TokensUnwrappedAuditServiceMock } from '../../test/mocks/tokens-unwrapped-audit.service.mock';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { TokensUnwrappedStatus } from '../tokens-unwrapped/tokens-unwrapped.const';

describe('TransactionEvaluationService', () => {
  let service: TransactionEvaluationService;
  let factory: Factory;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              ...config(),
            }),
          ],
          isGlobal: true,
        }),
        TestDatabaseModule,
        TransactionEvaluationModule,
      ],
    })
      .overrideProvider(NotificationsService)
      .useValue(NotificationsServiceMock)
      .overrideProvider(TokensUnwrappedAuditService)
      .useValue(TokensUnwrappedAuditServiceMock)
      .compile();

    service = module.get<TransactionEvaluationService>(
      TransactionEvaluationService,
    );

    await initializeDatabase();
    factory = await getFactory();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    TokensUnwrappedAuditServiceMock.recordTransactionEvent.mockClear();
    await clearDatabase();
  });

  afterAll(async () => {
    await module.close();
  });

  describe('evaluateWrapTokenErrors', () => {
    it('should update status to CREATING_SAFE_TRANSACTION_UNPROCESSABLE when transaction has TOKENS_RECEIVED status and errors', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        {
          status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
          error: [{ code: 'ERR_TEST', message: 'Test error' }],
          isNotificationSent: false,
        },
      );

      await service.evaluateWrapTokenErrors(transaction.id);

      const updatedTransaction = await getRepository(
        WrapTokenTransactionEntity,
      ).findOne({ where: { id: transaction.id } });

      expect(updatedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          status:
            WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION_UNPROCESSABLE,
          isNotificationSent: true,
        }),
      );

      expect(
        NotificationsServiceMock.sendWrapTokensTransactionUnprocessableNotification,
      ).toHaveBeenCalledWith(transaction.id);
    });

    it('should update status to SAFE_TRANSACTION_UNPROCESSABLE when transaction has EXECUTING_SAFE_TRANSACTION status and errors', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        {
          status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
          error: [{ code: 'ERR_EXECUTION', message: 'Execution error' }],
          isNotificationSent: false,
        },
      );

      await service.evaluateWrapTokenErrors(transaction.id);

      const updatedTransaction = await getRepository(
        WrapTokenTransactionEntity,
      ).findOne({ where: { id: transaction.id } });

      expect(updatedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          status: WrapTokenTransactionStatus.SAFE_TRANSACTION_UNPROCESSABLE,
          isNotificationSent: true,
        }),
      );

      expect(
        NotificationsServiceMock.sendWrapTokensTransactionUnprocessableNotification,
      ).toHaveBeenCalledTimes(1);
      expect(
        NotificationsServiceMock.sendWrapTokensTransactionUnprocessableNotification,
      ).toHaveBeenCalledWith(transaction.id);
    });

    it('should update status to SAFE_TRANSACTION_UNPROCESSABLE when transaction has 5 or more errors and SAFE_TRANSACTION_CREATED status', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        {
          status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
          error: [
            { code: 'ERR_1', message: 'Error 1' },
            { code: 'ERR_2', message: 'Error 2' },
            { code: 'ERR_3', message: 'Error 3' },
            { code: 'ERR_4', message: 'Error 4' },
            { code: 'ERR_5', message: 'Error 5' },
          ],
          isNotificationSent: false,
        },
      );

      await service.evaluateWrapTokenErrors(transaction.id);

      const updatedTransaction = await getRepository(
        WrapTokenTransactionEntity,
      ).findOne({ where: { id: transaction.id } });

      expect(updatedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          status: WrapTokenTransactionStatus.SAFE_TRANSACTION_UNPROCESSABLE,
          isNotificationSent: true,
        }),
      );

      expect(
        NotificationsServiceMock.sendWrapTokensTransactionUnprocessableNotification,
      ).toHaveBeenCalledTimes(1);
      expect(
        NotificationsServiceMock.sendWrapTokensTransactionUnprocessableNotification,
      ).toHaveBeenCalledWith(transaction.id);
    });

    it('should not update status when transaction has fewer than 5 errors', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        {
          status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
          error: [
            { code: 'ERR_1', message: 'Error 1' },
            { code: 'ERR_2', message: 'Error 2' },
            { code: 'ERR_3', message: 'Error 3' },
          ],
          isNotificationSent: false,
        },
      );

      await service.evaluateWrapTokenErrors(transaction.id);

      const updatedTransaction = await getRepository(
        WrapTokenTransactionEntity,
      ).findOne({ where: { id: transaction.id } });

      expect(updatedTransaction).toEqual(
        expect.objectContaining({
          id: transaction.id,
          status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
        }),
      );

      expect(
        NotificationsServiceMock.sendWrapTokensTransactionUnprocessableNotification,
      ).not.toHaveBeenCalled();
    });
  });

  describe('evaluateTokensUnwrappedErrors', () => {
    it.each([
      {
        initialStatus: TokensUnwrappedStatus.CREATED,
        expectedStatus: TokensUnwrappedStatus.CREATED_UNPROCESSABLE,
      },
      {
        initialStatus: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
        expectedStatus:
          TokensUnwrappedStatus.AWAITING_CONFIRMATION_UNPROCESSABLE,
      },
      {
        initialStatus: TokensUnwrappedStatus.CONFIRMED,
        expectedStatus: TokensUnwrappedStatus.CONFIRMED_UNPROCESSABLE,
      },
      {
        initialStatus: TokensUnwrappedStatus.INIT_SEND_TOKENS,
        expectedStatus: TokensUnwrappedStatus.CONFIRMED_UNPROCESSABLE,
      },
      {
        initialStatus: TokensUnwrappedStatus.SENDING_TOKENS,
        expectedStatus: TokensUnwrappedStatus.SENDING_TOKENS_UNPROCESSABLE,
      },
    ])(
      'should update status to $expectedStatus when transaction status is $initialStatus and has an error',
      async ({ initialStatus, expectedStatus }) => {
        const transaction = await factory.create<TokensUnwrappedEntity>(
          TokensUnwrappedEntity.name,
          {
            error: [{ code: 'ERR_1', message: 'Error 1' }],
            isErrorNotificationSent: false,
            status: initialStatus,
          },
        );

        await service.evaluateTokensUnwrappedErrors(transaction.id);

        const updatedTransaction = await getRepository(
          TokensUnwrappedEntity,
        ).findOne({ where: { id: transaction.id } });

        expect(updatedTransaction).toEqual(
          expect.objectContaining({
            id: transaction.id,
            status: expectedStatus,
            isErrorNotificationSent: true,
          }),
        );

        expect(
          NotificationsServiceMock.sendTokensUnwrappedUnprocessableNotification,
        ).toHaveBeenCalledTimes(1);
        expect(
          NotificationsServiceMock.sendTokensUnwrappedUnprocessableNotification,
        ).toHaveBeenCalledWith(transaction.id);

        expect(
          TokensUnwrappedAuditServiceMock.recordTransactionEvent,
        ).toHaveBeenCalledTimes(1);
        expect(
          TokensUnwrappedAuditServiceMock.recordTransactionEvent,
        ).toHaveBeenCalledWith({
          transactionId: transaction.id,
          paymentId: transaction.paymentId,
          fromStatus: transaction.status,
          toStatus: expectedStatus,
        });
      },
    );
  });
});
