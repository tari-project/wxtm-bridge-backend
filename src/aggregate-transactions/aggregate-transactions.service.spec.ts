import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import config from '../config/config';
import {
  clearDatabase,
  getRepository,
  initializeDatabase,
  TestDatabaseModule,
} from '../../test/database';
import { AggregateTransactionsModule } from './aggregate-transactions.module';
import { AggregateTransactionsService } from './aggregate-transactions.service';
import { Factory, getFactory } from '../../test/factory/factory';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import {
  WrapTokenTransactionOrigin,
  WrapTokenTransactionStatus,
} from '../wrap-token-transaction/wrap-token-transaction.const';
import { WrapTokenAuditEntity } from '../wrap-token-audit/wrap-token-audit.entity';

describe('AggregateTransactionsService', () => {
  let service: AggregateTransactionsService;
  let factory: Factory;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              ...config(),
              mineToExchange: {
                addressPrefix: 'eth-mainnet',
                minTokenAmount: '8000000',
              },
            }),
          ],
          isGlobal: true,
        }),
        AggregateTransactionsModule,
        TestDatabaseModule,
      ],
    }).compile();

    service = module.get<AggregateTransactionsService>(
      AggregateTransactionsService,
    );

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

  describe('mineToExchangeTransactions', () => {
    const to = '0x1234567890abcdef1234567890abcdef12345678';

    it('create aggregated transaction from dust transactions', async () => {
      const [tx_1, tx_2] = await factory.createMany<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        [
          {
            origin: WrapTokenTransactionOrigin.MININING,
            status:
              WrapTokenTransactionStatus.MINING_TOKENS_RECEIVED_BELOW_MIN_AMOUNT,
            to,
            tokenAmount: '7000000',
          },
          {
            origin: WrapTokenTransactionOrigin.MININING,
            status:
              WrapTokenTransactionStatus.MINING_TOKENS_RECEIVED_BELOW_MIN_AMOUNT,
            to,
            tokenAmount: '1000000',
          },
        ],
      );

      await service.aggregateDustTransactions(to);

      const updatedTransactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find({
        relations: ['aggregatedTransactions'],
      });
      expect(updatedTransactions).toHaveLength(3);

      const aggregatedTx = updatedTransactions.find(
        (t) => t.transactionId === null,
      );

      expect(aggregatedTx).toMatchObject({
        origin: WrapTokenTransactionOrigin.MININING,
        status: WrapTokenTransactionStatus.TOKENS_RECEIVED_AGGREGATED,
        to,
        from: 'aggregated_mining_transactions',
        tokenAmount: '8000000',
        feeAmount: '40000',
        amountAfterFee: '7960000',
        feePercentageBps: 50,
        aggregatedTransactions: expect.arrayContaining([
          expect.objectContaining({
            id: tx_1.id,
            transactionId: aggregatedTx?.id,
            status: WrapTokenTransactionStatus.REPLACED_BY_AGGREGATED,
          }),
          expect.objectContaining({
            id: tx_2.id,
            transactionId: aggregatedTx?.id,
            status: WrapTokenTransactionStatus.REPLACED_BY_AGGREGATED,
          }),
        ]),
      });

      const audits = await getRepository(WrapTokenAuditEntity).find();
      expect(audits).toHaveLength(1);
      expect(audits[0]).toMatchObject({
        transactionId: aggregatedTx?.id,
        paymentId: aggregatedTx?.paymentId,
        toStatus: WrapTokenTransactionStatus.TOKENS_RECEIVED_AGGREGATED,
      });
    });

    it('should not aggregate when only one dust transaction exists', async () => {
      const tx = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        {
          origin: WrapTokenTransactionOrigin.MININING,
          status:
            WrapTokenTransactionStatus.MINING_TOKENS_RECEIVED_BELOW_MIN_AMOUNT,
          to,
          tokenAmount: '9000000',
        },
      );

      await service.aggregateDustTransactions(to);

      const updatedTransactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();
      expect(updatedTransactions).toHaveLength(1);

      expect(updatedTransactions[0]).toMatchObject({
        id: tx.id,
        origin: WrapTokenTransactionOrigin.MININING,
        status:
          WrapTokenTransactionStatus.MINING_TOKENS_RECEIVED_BELOW_MIN_AMOUNT,
        to,
        tokenAmount: '9000000',
        transactionId: null,
      });

      const audits = await getRepository(WrapTokenAuditEntity).find();
      expect(audits).toHaveLength(0);
    });

    it('should not aggregate when multiple dust transactions have insufficient cumulative amount', async () => {
      const [tx_1, tx_2, tx_3] =
        await factory.createMany<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          [
            {
              origin: WrapTokenTransactionOrigin.MININING,
              status:
                WrapTokenTransactionStatus.MINING_TOKENS_RECEIVED_BELOW_MIN_AMOUNT,
              to,
              tokenAmount: '30',
            },
            {
              origin: WrapTokenTransactionOrigin.MININING,
              status:
                WrapTokenTransactionStatus.MINING_TOKENS_RECEIVED_BELOW_MIN_AMOUNT,
              to,
              tokenAmount: '20',
            },
            {
              origin: WrapTokenTransactionOrigin.MININING,
              status:
                WrapTokenTransactionStatus.MINING_TOKENS_RECEIVED_BELOW_MIN_AMOUNT,
              to,
              tokenAmount: '40',
            },
          ],
        );

      await service.aggregateDustTransactions(to);

      const updatedTransactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();
      expect(updatedTransactions).toHaveLength(3);

      expect(updatedTransactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: tx_1.id,
            status:
              WrapTokenTransactionStatus.MINING_TOKENS_RECEIVED_BELOW_MIN_AMOUNT,
            tokenAmount: '30',
            transactionId: null,
          }),
          expect.objectContaining({
            id: tx_2.id,
            status:
              WrapTokenTransactionStatus.MINING_TOKENS_RECEIVED_BELOW_MIN_AMOUNT,
            tokenAmount: '20',
            transactionId: null,
          }),
          expect.objectContaining({
            id: tx_3.id,
            status:
              WrapTokenTransactionStatus.MINING_TOKENS_RECEIVED_BELOW_MIN_AMOUNT,
            tokenAmount: '40',
            transactionId: null,
          }),
        ]),
      );

      const audits = await getRepository(WrapTokenAuditEntity).find();
      expect(audits).toHaveLength(0);
    });
  });
});
