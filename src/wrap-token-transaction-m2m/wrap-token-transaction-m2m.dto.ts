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

export class BaseTransactionDTO {
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;
}

export class WalletTransactionDTO extends BaseTransactionDTO {
  @IsString()
  @IsNotEmpty()
  tariPaymentIdHex: string;

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
  walletTransactions: WalletTransactionDTO[];
}

export class CreatingTransactionRequestDTO {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BaseTransactionDTO)
  walletTransactions: BaseTransactionDTO[];
}

export class TransactionCreatedDTO extends BaseTransactionDTO {
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
  walletTransactions: TransactionCreatedDTO[];
}

export class ErrorUpdateDTO extends BaseTransactionDTO {
  @IsNotEmpty()
  error: Record<string, string>;
}

export class ErrorUpdateRequestDTO {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ErrorUpdateDTO)
  walletTransactions: ErrorUpdateDTO[];
}

export class ExecutingTransactionRequestDTO {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BaseTransactionDTO)
  walletTransactions: BaseTransactionDTO[];
}

export class TransactionExecutedRequestDTO {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BaseTransactionDTO)
  walletTransactions: BaseTransactionDTO[];
}
