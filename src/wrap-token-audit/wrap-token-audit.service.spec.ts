import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import config from '../config/config';
import { WrapTokenAuditModule } from './wrap-token-audit.module';
import { WrapTokenAuditService } from './wrap-token-audit.service';
import {
  TestDatabaseModule,
  initializeDatabase,
  clearDatabase,
  getRepository,
} from '../../test/database';
import { Factory, getFactory } from '../../test/factory/factory';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenAuditEntity } from './wrap-token-audit.entity';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';

describe('WrapTokenAuditService tests', () => {
  let module: TestingModule;
  let service: WrapTokenAuditService;
  let factory: Factory;
  let transaction: WrapTokenTransactionEntity;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [config], isGlobal: true }),
        TestDatabaseModule,
        WrapTokenAuditModule,
      ],
    }).compile();

    service = module.get(WrapTokenAuditService);
    await initializeDatabase();
    factory = await getFactory();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await clearDatabase();

    transaction = await factory.create<WrapTokenTransactionEntity>(
      WrapTokenTransactionEntity.name,
      {
        status: WrapTokenTransactionStatus.CREATED,
      },
    );
  });

  afterAll(async () => {
    await module.close();
  });

  describe('recordTransactionEvent', () => {
    it('should record a transaction status change event', async () => {
      const fromStatus = WrapTokenTransactionStatus.CREATED;
      const toStatus = WrapTokenTransactionStatus.TOKENS_SENT;
      const note = { code: 'INFO_CODE', message: 'Info message' };

      await service.recordTransactionEvent({
        fromStatus,
        toStatus,
        paymentId: transaction.paymentId,
        transactionId: transaction.id,
        note,
      });

      const auditRecords = await getRepository(WrapTokenAuditEntity).find();

      expect(auditRecords).toHaveLength(1);
      expect(auditRecords[0]).toEqual(
        expect.objectContaining({
          paymentId: transaction.paymentId,
          fromStatus,
          toStatus,
          note,
          transactionId: transaction.id,
        }),
      );
    });

    it('should record a transaction status change event without note', async () => {
      const fromStatus = WrapTokenTransactionStatus.CREATED;
      const toStatus = WrapTokenTransactionStatus.TOKENS_RECEIVED;

      await service.recordTransactionEvent({
        fromStatus,
        toStatus,
        paymentId: transaction.paymentId,
        transactionId: transaction.id,
      });

      const auditRecords = await getRepository(WrapTokenAuditEntity).find();

      expect(auditRecords).toHaveLength(1);
      expect(auditRecords[0]).toEqual(
        expect.objectContaining({
          paymentId: transaction.paymentId,
          fromStatus,
          toStatus,
          note: null,
          transactionId: transaction.id,
        }),
      );
    });

    it('should record a note without status change', async () => {
      const note = { code: 'ERROR_CODE', message: 'Error message' };

      await service.recordTransactionEvent({
        paymentId: transaction.paymentId,
        transactionId: transaction.id,
        note,
      });

      const auditRecords = await getRepository(WrapTokenAuditEntity).find();

      expect(auditRecords).toHaveLength(1);
      expect(auditRecords[0]).toEqual(
        expect.objectContaining({
          paymentId: transaction.paymentId,
          fromStatus: null,
          toStatus: null,
          note,
          transactionId: transaction.id,
        }),
      );
    });
  });
});
