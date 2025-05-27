import {
  IsEthereumAddress,
  IsNotEmpty,
  IsNumberString,
  IsString,
} from 'class-validator';
import { PickType } from '@nestjs/swagger';

import { IsMinMaxNumberString } from '../decorators/is-min-max-number-string';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';

export class CreateWrapTokenReqDTO {
  @IsNotEmpty()
  @IsString()
  from: string;

  @IsNotEmpty()
  @IsEthereumAddress()
  to: string;

  @IsNotEmpty()
  @IsNumberString()
  @IsMinMaxNumberString({ min: '1000000000', max: '1000000000000000' })
  tokenAmount: string;
}

export class CreateWrapTokenRespDTO {
  paymentId: string;
}

export enum UserTransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
}

export class UserTransactionDTO extends PickType(WrapTokenTransactionEntity, [
  'tokenAmount',
  'amountAfterFee',
  'feeAmount',
  'createdAt',
]) {
  status: UserTransactionStatus;
  destinationAddress: string;
}

export class GetUserTransactionsRespDTO {
  transactions: UserTransactionDTO[];
}

export class GetWrapTokenParamsRespDTO {
  coldWalletAddress: string;
  wrapTokenFeePercentageBps: number;
}
