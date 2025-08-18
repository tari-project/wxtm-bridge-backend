import { AggregateTransactionsService } from '../../src/aggregate-transactions/aggregate-transactions.service';

type AggregateTransactionsServiceMock = {
  [method in keyof AggregateTransactionsService]: jest.Mock;
};

export const AggregateTransactionsServiceMock = {
  aggregateDustTransactions: jest.fn().mockResolvedValue(undefined),
  aggregateDustWithMainTransaction: jest.fn().mockResolvedValue(undefined),
} satisfies Partial<AggregateTransactionsServiceMock>;
