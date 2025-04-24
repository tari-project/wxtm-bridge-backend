import {
  IsEthereumAddress,
  IsNotEmpty,
  IsNumberString,
  IsString,
} from 'class-validator';

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
