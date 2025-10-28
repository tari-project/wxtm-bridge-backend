import {
  IsEthereumAddress,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';

import { IsMinMaxNumberString } from '../decorators/is-min-max-number-string';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { ServiceStatus } from '../settings/settings.const';

export class DebugDataDTO {
  @IsOptional()
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
  })
  debug?: Record<string, string>;
}

export class CreateWrapTokenReqDTO extends DebugDataDTO {
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

export class UpdateToTokensSentReqDTO extends DebugDataDTO {}

export class CreateWrapTokenRespDTO {
  paymentId: string;
}

export enum UserTransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  TIMEOUT = 'TIMEOUT',
  TOKENS_RECEIVED = 'TOKENS_RECEIVED',
  PROCESSING = 'PROCESSING',
}

export class UserTransactionDTO extends PickType(WrapTokenTransactionEntity, [
  'tokenAmount',
  'paymentId',
  'amountAfterFee',
  'feeAmount',
  'createdAt',
  'transactionHash',
]) {
  status: UserTransactionStatus;
  destinationAddress: string;
}

export class GetUserTransactionsReqDTO {
  @IsNotEmpty()
  @IsString()
  walletAddress: string;
}

export class UpdateToTokensSentParamsReqDTO {
  @IsNotEmpty()
  @IsString()
  paymentId: string;
}

export class GetUserTransactionsRespDTO {
  transactions: UserTransactionDTO[];
}

export class GetWrapTokenParamsRespDTO {
  coldWalletAddress: string;
  wrapTokenFeePercentageBps: number;
}

export class GetWrapTokenServiceStatusRespDTO {
  status: ServiceStatus;
}
