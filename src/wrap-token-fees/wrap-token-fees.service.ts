import { Injectable } from '@nestjs/common';
import { BigNumber } from 'ethers';
import { ConfigService } from '@nestjs/config';

import {
  CalculateFeeParams,
  CalculateFeeResponse,
} from './wrap-token-fees.types';
import { IConfig } from '../config/config.interface';

@Injectable()
export class WrapTokenFeesService {
  constructor(protected readonly configService: ConfigService<IConfig, true>) {}

  calculateFee({ tokenAmount }: CalculateFeeParams): CalculateFeeResponse {
    const { wrapTokenFeePercentageBps } = this.configService.get('fees', {
      infer: true,
    });

    const amount = BigNumber.from(tokenAmount);

    const feeAmount = amount.mul(wrapTokenFeePercentageBps).div(10000);
    const amountAfterFee = amount.sub(feeAmount);

    return {
      feeAmount: feeAmount.toString(),
      amountAfterFee: amountAfterFee.toString(),
      feePercentageBps: wrapTokenFeePercentageBps,
    };
  }
}
