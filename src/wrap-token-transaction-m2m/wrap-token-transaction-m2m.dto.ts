import { ApiProperty } from '@nestjs/swagger';
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

export class WalletTransactionDTO_DELETE extends BaseTransactionDTO {
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

export class TokensReceivedRequestDTO_DELETE {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WalletTransactionDTO_DELETE)
  walletTransactions: WalletTransactionDTO_DELETE[];
}

export class WalletTransactionDTO extends BaseTransactionDTO {
  @IsNumberString()
  @IsNotEmpty()
  amount: string;

  @IsNotEmpty()
  @IsNumber()
  timestamp: number;

  @IsNotEmpty()
  @IsNumber()
  blockHeight: number;

  @IsNotEmpty()
  @IsString()
  paymentReference: string;
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
  @IsOptional()
  @IsString()
  safeAddress?: string;

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
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
  })
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

export class TransactionExecutedDTO extends BaseTransactionDTO {
  @IsOptional()
  @IsString()
  transactionHash?: string;
}

export class TransactionExecutedRequestDTO {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionExecutedDTO)
  walletTransactions: TransactionExecutedDTO[];
}
