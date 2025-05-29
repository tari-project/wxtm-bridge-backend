import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EventBridgeEvent } from 'aws-lambda';

import config from '../config/config';
import {
  TestDatabaseModule,
  initializeDatabase,
  clearDatabase,
  getRepository,
} from '../../test/database';
import { Factory, getFactory } from '../../test/factory/factory';
import { TransactionTimeoutModule } from './transaction-timeout.module';
import { TransactionTimeoutService } from './transaction-timeout.service';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';

describe('SubgraphService tests', () => {
  let factory: Factory;
  let module: TestingModule;
  let service: TransactionTimeoutService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [config], isGlobal: true }),
        TestDatabaseModule,
        TransactionTimeoutModule,
      ],
    })

      .compile();

    service = module.get(TransactionTimeoutService);

    await initializeDatabase();
    factory = await getFactory();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await clearDatabase();
  });

  afterAll(async () => {
    await module.close();
  });

  describe('onEventReceived', () => {
    it('should handle empty tokens list', async () => {
      await service.onEventReceived(
        {} as unknown as EventBridgeEvent<any, any>,
      );
    });

    it('should update timed out transactions', async () => {
      const mockNow = new Date('2023-01-01T12:00:00Z');
      jest.spyOn(service, 'getDateTimeNow').mockReturnValue(mockNow);

      const timeBeforeTimeout = new Date(mockNow.getTime() - 3600000 - 1000); // 1 hour and 1 second ago

      const [
        txShouldTimeout1, // CREATED status, old enough to timeout
        txShouldTimeout2, // TOKENS_SENT status, old enough to timeout
        txTooRecent, // CREATED status, but too recent to timeout
        txAlreadyTimeOut, // Already in TIMEOUT status
        txWithTariPaymentId, // Has tariPaymentIdHex, shouldn't timeout
        txWithTariTxTimestamp, // Has tariTxTimestamp, shouldn't timeout
        txTokensReceived, // TOKENS_RECEIVED status, shouldn't timeout
      ] = await factory.createMany<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        7,
        [
          {
            status: WrapTokenTransactionStatus.CREATED,
            updatedAt: timeBeforeTimeout,
          },
          {
            status: WrapTokenTransactionStatus.TOKENS_SENT,
            updatedAt: timeBeforeTimeout,
          },
          {
            status: WrapTokenTransactionStatus.CREATED,
            updatedAt: new Date(mockNow.getTime() - 1000), // 1 second ago
          },
          {
            status: WrapTokenTransactionStatus.TIMEOUT,
            updatedAt: timeBeforeTimeout,
          },
          {
            status: WrapTokenTransactionStatus.CREATED,
            tariPaymentIdHex: '123abc',
            updatedAt: timeBeforeTimeout,
          },
          {
            status: WrapTokenTransactionStatus.CREATED,
            tariTxTimestamp: 12345,
            updatedAt: timeBeforeTimeout,
          },
          {
            status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
            updatedAt: timeBeforeTimeout,
          },
        ],
      );

      await service.onEventReceived({} as any);

      const updatedTransactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(updatedTransactions).toHaveLength(7);

      expect(updatedTransactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: txShouldTimeout1.id,
            status: WrapTokenTransactionStatus.TIMEOUT,
          }),
          expect.objectContaining({
            id: txShouldTimeout2.id,
            status: WrapTokenTransactionStatus.TIMEOUT,
          }),
          expect.objectContaining({
            id: txTooRecent.id,
            status: WrapTokenTransactionStatus.CREATED,
          }),
          expect.objectContaining({
            id: txAlreadyTimeOut.id,
            status: WrapTokenTransactionStatus.TIMEOUT,
          }),
          expect.objectContaining({
            id: txWithTariPaymentId.id,
            status: WrapTokenTransactionStatus.CREATED,
          }),
          expect.objectContaining({
            id: txWithTariTxTimestamp.id,
            status: WrapTokenTransactionStatus.CREATED,
          }),
          expect.objectContaining({
            id: txTokensReceived.id,
            status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
          }),
        ]),
      );
    });
  });
});
