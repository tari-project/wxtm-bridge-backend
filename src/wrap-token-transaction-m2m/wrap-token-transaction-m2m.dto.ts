import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class TokenTransactionDTO {
  @IsNumberString()
  @IsNotEmpty()
  txId: string;

  @IsUUID()
  @IsNotEmpty()
  paymentId: string;

  @IsNumberString()
  @IsNotEmpty()
  amount: string;

  @IsNumberString()
  @IsOptional()
  timestamp?: string;
}

export class TokensReceivedRequestDTO {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TokenTransactionDTO)
  tokenTransactions: TokenTransactionDTO[];
}
