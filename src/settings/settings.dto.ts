import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsNumberString,
} from 'class-validator';

import { IsMinMaxNumberString } from '../decorators/is-min-max-number-string';
import { ServiceStatus } from './settings.const';

export class UpdateSettingReqDTO {
  @IsEnum(ServiceStatus)
  @IsNotEmpty()
  wrapTokensServiceStatus: ServiceStatus;

  @IsNumber()
  @Min(2)
  @Max(50)
  @IsNotEmpty()
  maxBatchSize: number;

  @IsNumber()
  @Min(60000)
  @IsNotEmpty()
  maxBatchAgeMs: number;

  @IsNotEmpty()
  @IsNumberString()
  @IsMinMaxNumberString({
    min: '1000000000000000000000',
    max: '5000000000000000000000000',
  })
  batchAmountThreshold: string;

  @IsNotEmpty()
  @IsNumberString()
  @IsMinMaxNumberString({
    min: '1000000000000000000',
    max: '900000000000000000000000',
  })
  unwrapManualApprovalThreshold: string;
}
