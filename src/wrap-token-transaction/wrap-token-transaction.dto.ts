import {
  IsEnum,
  IsEthereumAddress,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { WrapTokenTransactionEntity } from './wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from './wrap-token-transaction.const';

export class CreateWrapTokenTransactionDTO {
  @IsNotEmpty()
  @IsString()
  from: string;

  @IsNotEmpty()
  @IsEthereumAddress()
  to: string;

  @IsNotEmpty()
  @IsNumberString()
  tokenAmount: string;
}

export class UpdateWrapTokenTransactionDTO
  implements Partial<WrapTokenTransactionEntity>
{
  @IsOptional()
  @IsNumberString()
  tokenAmount?: string;

  @IsOptional()
  @IsEnum(WrapTokenTransactionStatus)
  status?: WrapTokenTransactionStatus;
}
