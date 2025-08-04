import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';

export class CreateMiningTransactionParams {
  from: string;
  to: string;
  amount: string;
  paymentReference: string;
  blockHeight: number;
  timestamp: number;
  paymentId?: string;
  status: WrapTokenTransactionStatus;
}
