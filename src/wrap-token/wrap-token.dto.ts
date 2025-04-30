import {
  IsEthereumAddress,
  IsNotEmpty,
  IsNumberString,
  IsString,
} from 'class-validator';

export class CreateWrapTokenReqDTO {
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

export class CreateWrapTokenRespDTO {
  paymentId: string;
}
