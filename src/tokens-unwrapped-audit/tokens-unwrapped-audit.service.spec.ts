import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import config from '../config/config';
import { TokensUnwrappedAuditModule } from './tokens-unwrapped-audit.module';
import { TokensUnwrappedAuditService } from './tokens-unwrapped-audit.service';
import {
  TestDatabaseModule,
  initializeDatabase,
  clearDatabase,
  getRepository,
} from '../../test/database';
import { Factory, getFactory } from '../../test/factory/factory';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { TokensUnwrappedAuditEntity } from './tokens-unwrapped-audit.entity';
import { TokensUnwrappedStatus } from '../tokens-unwrapped/tokens-unwrapped.const';

describe('TokensUnwrappedAuditService tests', () => {
  let module: TestingModule;
  let service: TokensUnwrappedAuditService;
  let factory: Factory;
  let transaction: TokensUnwrappedEntity;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [config], isGlobal: true }),
        TestDatabaseModule,
        TokensUnwrappedAuditModule,
      ],
    }).compile();

    service = module.get(TokensUnwrappedAuditService);
    await initializeDatabase();
    factory = await getFactory();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await clearDatabase();

    transaction = await factory.create<TokensUnwrappedEntity>(
      TokensUnwrappedEntity.name,
      {
        status: TokensUnwrappedStatus.CREATED,
      },
    );
  });

  afterAll(async () => {
    await module.close();
  });

  describe('recordTransactionEvent', () => {
    it('should record a unwrap transaction status change event', async () => {
      const fromStatus = TokensUnwrappedStatus.CREATED;
      const toStatus = TokensUnwrappedStatus.CONFIRMED;
      const note = { code: 'INFO_CODE', message: 'Info message' };

      await service.recordTransactionEvent({
        fromStatus,
        toStatus,
        paymentId: transaction.paymentId,
        transactionId: transaction.id,
        note,
      });

      const auditRecords = await getRepository(
        TokensUnwrappedAuditEntity,
      ).find();

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

    it('should record a unwrap transaction status change event without note', async () => {
      const fromStatus = TokensUnwrappedStatus.CREATED;
      const toStatus = TokensUnwrappedStatus.TOKENS_SENT;

      await service.recordTransactionEvent({
        fromStatus,
        toStatus,
        paymentId: transaction.paymentId,
        transactionId: transaction.id,
      });

      const auditRecords = await getRepository(
        TokensUnwrappedAuditEntity,
      ).find();

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

    it('should record a note without status change for unwrap', async () => {
      const note = { code: 'ERROR_CODE', message: 'Error message' };

      await service.recordTransactionEvent({
        paymentId: transaction.paymentId,
        transactionId: transaction.id,
        note,
      });

      const auditRecords = await getRepository(
        TokensUnwrappedAuditEntity,
      ).find();

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
