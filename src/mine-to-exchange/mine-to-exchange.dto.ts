import {
  IsArray,
  IsEthereumAddress,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { IsMinMaxNumberString } from '../decorators/is-min-max-number-string';

export class MineToExchangeConfigDTO {
  @IsEthereumAddress()
  @IsNotEmpty()
  toAddress: string;
}

export class MineToExchangeConfigRespDTO {
  walletAddress: string;
  paymentId: string;
}

export class MiningTransactionDTO {
  @IsNotEmpty()
  @IsString()
  from: string;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsNotEmpty()
  @IsNumberString()
  @IsMinMaxNumberString({ min: '1', max: '1000000000000000' })
  amount: string;

  @IsNotEmpty()
  @IsString()
  paymentReference: string;

  @IsNotEmpty()
  @IsNumber()
  blockHeight: number;

  @IsNotEmpty()
  @IsNumber()
  timestamp: number;
}

export class CreateMiningTransactionsDTO {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MiningTransactionDTO)
  transactions: MiningTransactionDTO[];
}
