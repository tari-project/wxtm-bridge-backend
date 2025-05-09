import {
  IsEthereumAddress,
  IsNotEmpty,
  IsNumberString,
  IsString,
} from 'class-validator';

import { IsMinMaxNumberString } from '../decorators/is-min-max-number-string';

export class CreateWrapTokenReqDTO {
  @IsNotEmpty()
  @IsString()
  from: string;

  @IsNotEmpty()
  @IsEthereumAddress()
  to: string;

  @IsNotEmpty()
  @IsNumberString()
  @IsMinMaxNumberString({ min: '1000000000', max: '1000000000000000' })
  tokenAmount: string;
}

export class CreateWrapTokenRespDTO {
  paymentId: string;
}
