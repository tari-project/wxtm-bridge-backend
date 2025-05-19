import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class WalletTransactionDTO {
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
  @Type(() => WalletTransactionDTO)
  wallelTransactions: WalletTransactionDTO[];
}

export class TransactionProposedDTO {
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;

  @IsNotEmpty()
  @IsString()
  safeTxHash: string;

  @IsNotEmpty()
  @IsNumber()
  safeNonce: number;
}

export class TransactionProposedRequestDTO {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionProposedDTO)
  wallelTransactions: TransactionProposedDTO[];
}

export class ErrorUpdateDTO {
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;

  @IsNotEmpty()
  error: Record<string, string>;
}

export class ErrorUpdateRequestDTO {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ErrorUpdateDTO)
  wallelTransactions: ErrorUpdateDTO[];
}
