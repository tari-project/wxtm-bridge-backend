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

export class CreatingTransactionDTO {
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;
}

export class CreatingTransactionRequestDTO {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatingTransactionDTO)
  wallelTransactions: CreatingTransactionDTO[];
}

export class TransactionCreatedDTO {
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

export class TransactionCreatedRequestDTO {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionCreatedDTO)
  wallelTransactions: TransactionCreatedDTO[];
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
