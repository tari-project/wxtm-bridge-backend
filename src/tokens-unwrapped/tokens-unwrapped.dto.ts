import { PickType } from '@nestjs/swagger';

import { TokensUnwrappedEntity } from './tokens-unwrapped.entity';

export enum UserUnwrappedTransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR',
}

export class UserUnwrappedTransactionDTO extends PickType(
  TokensUnwrappedEntity,
  [
    'paymentId',
    'amount',
    'amountAfterFee',
    'feeAmount',
    'createdAt',
    'transactionHash',
    'blockTimestamp',
  ],
) {
  status: UserUnwrappedTransactionStatus;
  destinationAddress: string;
}

export class GetUserUnwrappedTransactionsRespDTO {
  transactions: UserUnwrappedTransactionDTO[];
}
