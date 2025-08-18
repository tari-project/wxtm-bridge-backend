import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import config from '../config/config';
import { MineToExchangeModule } from './mine-to-exchange.module';
import {
  CreateMiningTransactionsDTO,
  MineToExchangeConfigDTO,
  MiningTransactionDTO,
} from './mine-to-exchange.dto';
import { setMiddlewares } from '../helpers/setMiddlewares';
import { M2MAuthModule } from '../m2m-auth/m2m-auth.module';
import {
  TestDatabaseModule,
  initializeDatabase,
  clearDatabase,
  getRepository,
} from '../../test/database';
import { getFactory, Factory } from '../../test/factory/factory';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import {
  WrapTokenTransactionOrigin,
  WrapTokenTransactionStatus,
} from '../wrap-token-transaction/wrap-token-transaction.const';
import { WrapTokenAuditEntity } from '../wrap-token-audit/wrap-token-audit.entity';
import { AggregateTransactionsService } from '../aggregate-transactions/aggregate-transactions.service';
import { AggregateTransactionsServiceMock } from '../../test/mocks/aggregate-transactions.service.mock';

describe('MineToExchangeController', () => {
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
              mineToExchange: {
                ...config().mineToExchange,
                walletAddress: '0xTestWalletAddress',
                addressPrefix: 'eth-mainnet',
              },
            }),
          ],
          isGlobal: true,
        }),
        TestDatabaseModule,
        M2MAuthModule.register({ authToken: m2mToken }),
        MineToExchangeModule,
      ],
    })
      .overrideProvider(AggregateTransactionsService)
      .useValue(AggregateTransactionsServiceMock)
      .compile();

    app = module.createNestApplication({ bodyParser: true });
    setMiddlewares(app);

    await app.init();
    await initializeDatabase();
    factory = await getFactory();
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /mine-to-exchange/config', () => {
    it('returns walletAddress and paymentId', async () => {
      const dto: MineToExchangeConfigDTO = {
        toAddress: '0xD34dB33F000000000000000000000000DeAdBeEf',
      };

      const { body } = await request(app.getHttpServer())
        .post('/mine-to-exchange/config')
        .set('Content-Type', 'application/json')
        .send(dto)
        .expect(201);

      expect(body).toEqual({
        walletAddress: '0xTestWalletAddress',
        paymentId: `eth-mainnet:0xD34dB33F000000000000000000000000DeAdBeEf`,
      });
    });
  });

  describe('POST /mine-to-exchange/transactions', () => {
    const toAddress = '0x03605BB4F92012297287AD9E690Dea3acD591504';

    const transactionDTO: MiningTransactionDTO = {
      from: 'from-address',
      paymentId: `eth-mainnet:${toAddress}`,
      amount: '1000000000',
      paymentReference: 'ref-1',
      blockHeight: 1,
      timestamp: 1111,
    };

    it('should create a new transaction and call aggregateDustWithMainTransaction', async () => {
      const dto: CreateMiningTransactionsDTO = {
        transactions: [transactionDTO],
      };

      await request(app.getHttpServer())
        .post('/mine-to-exchange/transactions')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(201);

      const transactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        from: transactionDTO.from,
        to: toAddress,
        tokenAmount: transactionDTO.amount,
        feePercentageBps: 50,
        feeAmount: '5000000',
        amountAfterFee: '995000000',
        tariPaymentReference: transactionDTO.paymentReference,
        tariBlockHeight: transactionDTO.blockHeight,
        tariTxTimestamp: transactionDTO.timestamp,
        incomingPaymentId: transactionDTO.paymentId,
        status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
        origin: WrapTokenTransactionOrigin.MININING,
      });

      expect(
        AggregateTransactionsServiceMock.aggregateDustWithMainTransaction,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: transactions[0].id,
          status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
        }),
      );

      const audits = await getRepository(WrapTokenAuditEntity).find();
      expect(audits).toHaveLength(1);
      expect(audits[0]).toMatchObject({
        transactionId: transactions[0].id,
        paymentId: transactions[0].paymentId,
        toStatus: WrapTokenTransactionStatus.TOKENS_RECEIVED,
      });
    });

    it('should only create transactions that do not already exist', async () => {
      const paymentReference = 'ref-3';

      await factory.create<WrapTokenTransactionEntity>(
        WrapTokenTransactionEntity.name,
        { tariPaymentReference: paymentReference },
      );

      const existingTransactionPayload: MiningTransactionDTO = {
        from: 'from-2',
        paymentId: 'eth-mainnet:0xD34dB33F000000000000000000000000DeAdBeEf',
        amount: '1000000000',
        paymentReference: paymentReference,
        blockHeight: 2,
        timestamp: 222,
      };

      const dto: CreateMiningTransactionsDTO = {
        transactions: [transactionDTO, existingTransactionPayload],
      };

      await request(app.getHttpServer())
        .post('/mine-to-exchange/transactions')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(201);

      const transactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();
      expect(transactions).toHaveLength(2);

      const createdTx = transactions.find(
        (tx) => tx.tariPaymentReference === transactionDTO.paymentReference,
      );
      expect(createdTx).toMatchObject({
        from: transactionDTO.from,
        to: toAddress,
        tokenAmount: transactionDTO.amount,
        feePercentageBps: 50,
        feeAmount: '5000000',
        amountAfterFee: '995000000',
        tariPaymentReference: transactionDTO.paymentReference,
        tariBlockHeight: transactionDTO.blockHeight,
        tariTxTimestamp: transactionDTO.timestamp,
        incomingPaymentId: transactionDTO.paymentId,
        status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
        origin: WrapTokenTransactionOrigin.MININING,
      });

      const audits = await getRepository(WrapTokenAuditEntity).find();
      expect(audits).toHaveLength(1);
      expect(audits[0]).toMatchObject({
        transactionId: createdTx?.id,
        paymentId: createdTx?.paymentId,
        toStatus: WrapTokenTransactionStatus.TOKENS_RECEIVED,
      });
    });

    it('should create a new transaction with status MINING_TOKENS_RECEIVED_BELOW_MIN_AMOUNT and call aggregateDustTransactions', async () => {
      const transactionDTOLowAmount: MiningTransactionDTO = {
        ...transactionDTO,
        amount: '7999999',
      };

      const dto: CreateMiningTransactionsDTO = {
        transactions: [transactionDTOLowAmount],
      };

      await request(app.getHttpServer())
        .post('/mine-to-exchange/transactions')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(201);

      const transactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        from: transactionDTOLowAmount.from,
        to: toAddress,
        tokenAmount: '7999999',
        feePercentageBps: 50,
        feeAmount: '39999',
        amountAfterFee: '7960000',
        status:
          WrapTokenTransactionStatus.MINING_TOKENS_RECEIVED_BELOW_MIN_AMOUNT,
      });

      expect(
        AggregateTransactionsServiceMock.aggregateDustTransactions,
      ).toHaveBeenCalledWith(toAddress);

      const audits = await getRepository(WrapTokenAuditEntity).find();
      expect(audits).toHaveLength(1);
      expect(audits[0]).toMatchObject({
        transactionId: transactions[0].id,
        toStatus:
          WrapTokenTransactionStatus.MINING_TOKENS_RECEIVED_BELOW_MIN_AMOUNT,
      });
    });

    it('should create a new transaction with status MINING_INCORRECT_PAYMENT_ID', async () => {
      const transactionDTOincorrectPaymentId: MiningTransactionDTO = {
        ...transactionDTO,
        paymentId: 'incorrect-payment-id',
      };

      const dto: CreateMiningTransactionsDTO = {
        transactions: [transactionDTOincorrectPaymentId],
      };

      await request(app.getHttpServer())
        .post('/mine-to-exchange/transactions')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(201);

      const transactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        tariPaymentReference: transactionDTOincorrectPaymentId.paymentReference,
        to: 'not_provided',
        incomingPaymentId: 'incorrect-payment-id',
        status: WrapTokenTransactionStatus.MINING_INCORRECT_PAYMENT_ID,
      });

      expect(
        AggregateTransactionsServiceMock.aggregateDustWithMainTransaction,
      ).not.toHaveBeenCalled();
      expect(
        AggregateTransactionsServiceMock.aggregateDustTransactions,
      ).not.toHaveBeenCalled();

      const audits = await getRepository(WrapTokenAuditEntity).find();
      expect(audits).toHaveLength(1);
      expect(audits[0]).toMatchObject({
        transactionId: transactions[0].id,
        toStatus: WrapTokenTransactionStatus.MINING_INCORRECT_PAYMENT_ID,
      });
    });

    it('should create a new transaction with status MINING_INCORRECT_PAYMENT_ID when payment id is not provided', async () => {
      const transactionDTOincorrectPaymentId: MiningTransactionDTO = {
        ...transactionDTO,
        paymentId: undefined,
      };

      const dto: CreateMiningTransactionsDTO = {
        transactions: [transactionDTOincorrectPaymentId],
      };

      await request(app.getHttpServer())
        .post('/mine-to-exchange/transactions')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(201);

      const transactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        tariPaymentReference: transactionDTOincorrectPaymentId.paymentReference,
        to: 'not_provided',
        incomingPaymentId: null,
        status: WrapTokenTransactionStatus.MINING_INCORRECT_PAYMENT_ID,
      });

      expect(
        AggregateTransactionsServiceMock.aggregateDustWithMainTransaction,
      ).not.toHaveBeenCalled();
      expect(
        AggregateTransactionsServiceMock.aggregateDustTransactions,
      ).not.toHaveBeenCalled();

      const audits = await getRepository(WrapTokenAuditEntity).find();
      expect(audits).toHaveLength(1);
      expect(audits[0]).toMatchObject({
        transactionId: transactions[0].id,
        toStatus: WrapTokenTransactionStatus.MINING_INCORRECT_PAYMENT_ID,
      });
    });

    it('should create a new transaction with status MINING_INCORRECT_PAYMENT_ID_AND_AMOUNT', async () => {
      const transactionDTOincorrectPaymentIdAndAmount: MiningTransactionDTO = {
        ...transactionDTO,
        paymentId: 'incorrect-payment-id',
        amount: '1',
      };

      const dto: CreateMiningTransactionsDTO = {
        transactions: [transactionDTOincorrectPaymentIdAndAmount],
      };

      await request(app.getHttpServer())
        .post('/mine-to-exchange/transactions')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(201);

      const transactions = await getRepository(
        WrapTokenTransactionEntity,
      ).find();

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        tariPaymentReference:
          transactionDTOincorrectPaymentIdAndAmount.paymentReference,
        to: 'not_provided',
        incomingPaymentId: 'incorrect-payment-id',
        tokenAmount: '1',
        feePercentageBps: 50,
        feeAmount: '0',
        amountAfterFee: '1',
        status:
          WrapTokenTransactionStatus.MINING_INCORRECT_PAYMENT_ID_AND_AMOUNT,
      });

      const audits = await getRepository(WrapTokenAuditEntity).find();
      expect(audits).toHaveLength(1);
      expect(audits[0]).toMatchObject({
        transactionId: transactions[0].id,
        toStatus:
          WrapTokenTransactionStatus.MINING_INCORRECT_PAYMENT_ID_AND_AMOUNT,
      });
    });

    it('should not be accessible with an incorrect token', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/mine-to-exchange/transactions')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer incoRrect-token')
        .send({})
        .expect(401);

      expect(body).toEqual({ message: 'Unauthorized', statusCode: 401 });
    });
  });
});
