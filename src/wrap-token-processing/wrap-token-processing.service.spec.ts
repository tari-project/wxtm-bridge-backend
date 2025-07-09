import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import config from '../config/config';
import {
  TestDatabaseModule,
  initializeDatabase,
  clearDatabase,
  getRepository,
} from '../../test/database';
import { Factory, getFactory } from '../../test/factory/factory';
import { WrapTokenProcessingModule } from './wrap-token-processing.module';
import { WrapTokenProcessingService } from './wrap-token-processing.service';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenAuditEntity } from '../wrap-token-audit/wrap-token-audit.entity';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { TokensReceivedDTO } from './wrap-token-processing.dto';

describe('WrapTokenProcessingService tests', () => {
  let factory: Factory;
  let module: TestingModule;
  let service: WrapTokenProcessingService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [config], isGlobal: true }),
        TestDatabaseModule,
        WrapTokenProcessingModule,
      ],
    }).compile();

    service = module.get(WrapTokenProcessingService);

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

  describe('onTokensReceived', () => {
    it.each([
      [WrapTokenTransactionStatus.CREATED],
      [WrapTokenTransactionStatus.TOKENS_SENT],
      [WrapTokenTransactionStatus.TIMEOUT],
    ])(
      'should update transaction status to TOKENS_RECEIVED from status %s',
      async (initialStatus) => {
        const transaction = await factory.create<WrapTokenTransactionEntity>(
          WrapTokenTransactionEntity.name,
          {
            status: initialStatus,
            tokenAmount: '1000',
          },
        );

        const event: TokensReceivedDTO = {
          amount: '1000',
          paymentId: transaction.paymentId,
          timestamp: 1747209840,
        };

        await service.onTokensReceived(event);

        const updatedTransaction = await getRepository(
          WrapTokenTransactionEntity,
        ).findOneOrFail({
          where: { id: transaction.id },
        });

        expect(updatedTransaction).toEqual(
          expect.objectContaining({
            status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
            tariPaymentIdHex: null,
            tokenAmount: '1000',
            tokenAmountInWallet: '1000',
            tariTxTimestamp: 1747209840,
          }),
        );

        const auditRecords = await getRepository(WrapTokenAuditEntity).find();
        expect(auditRecords).toHaveLength(1);
        expect(auditRecords[0]).toEqual(
          expect.objectContaining({
            transactionId: transaction.id,
            paymentId: transaction.paymentId,
            fromStatus: initialStatus,
            toStatus: WrapTokenTransactionStatus.TOKENS_RECEIVED,
          }),
        );
      },
    );

    it('should update transactions status to TOKENS_RECEIVED_WITH_MISMATCH when amount differs', async () => {
      const transaction = await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        { status: WrapTokenTransactionStatus.TOKENS_SENT, tokenAmount: '1000' },
      );

      const event: TokensReceivedDTO = {
        amount: '3000',
        paymentId: transaction.paymentId,
        timestamp: 1747209840,
      };

      await service.onTokensReceived(event);

      const updatedTransaction = await getRepository(
        WrapTokenTransactionEntity,
      ).findOneOrFail({
        where: { id: transaction.id },
      });

      expect(updatedTransaction).toEqual(
        expect.objectContaining({
          status: WrapTokenTransactionStatus.TOKENS_RECEIVED_WITH_MISMATCH,
          tariPaymentIdHex: null,
          tokenAmount: '1000',
          tokenAmountInWallet: '3000',
          tariTxTimestamp: 1747209840,
        }),
      );

      const auditRecords = await getRepository(WrapTokenAuditEntity).find();
      expect(auditRecords).toHaveLength(1);
      expect(auditRecords[0]).toEqual(
        expect.objectContaining({
          transactionId: transaction.id,
          paymentId: transaction.paymentId,
          fromStatus: WrapTokenTransactionStatus.TOKENS_SENT,
          toStatus: WrapTokenTransactionStatus.TOKENS_RECEIVED_WITH_MISMATCH,
        }),
      );
    });
  });
});
