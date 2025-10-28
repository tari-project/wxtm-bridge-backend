import { WrapTokenTransactionM2MService } from '../../src/wrap-token-transaction-m2m/wrap-token-transaction-m2m.service';

type WrapTokenTransactionM2MServiceMock = {
  [method in keyof WrapTokenTransactionM2MService]: jest.Mock;
};

export const WrapTokenTransactionM2MServiceMock = {
  getTodayProcessedTransactionsSum: jest.fn().mockResolvedValue('0'),
} satisfies Partial<WrapTokenTransactionM2MServiceMock>;
