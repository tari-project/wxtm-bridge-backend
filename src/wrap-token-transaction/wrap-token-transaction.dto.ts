import {
  IsEnum,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { WrapTokenTransactionEntity } from './wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from './wrap-token-transaction.const';

export class UpdateWrapTokenTransactionDTO
  implements Partial<WrapTokenTransactionEntity>
{
  @IsOptional()
  @IsNumberString()
  tokenAmount?: string;

  @IsOptional()
  @IsEnum(WrapTokenTransactionStatus)
  status?: WrapTokenTransactionStatus;

  @IsOptional()
  @IsString()
  safeTxHash?: string;

  @IsOptional()
  @IsNumber()
  safeNonce?: number;
}
