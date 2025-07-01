import { TransactionEvaluationService } from '../../src/transaction-evaluation/transaction-evaluation.service';

type TransactionEvaluationServiceMock = {
  [method in keyof TransactionEvaluationService]: jest.Mock;
};

export const TransactionEvaluationServiceMock = {
  evaluateErrors: jest.fn(),
} satisfies Partial<TransactionEvaluationServiceMock>;
