import { Injectable } from '@nestjs/common';
import { BigNumber } from 'ethers';

import {
  CalculateFeeParams,
  CalculateFeeResponse,
} from './wrap-token-fees.types';
import { FEE_PERCENTAGE_BPS } from './wrap-token-fees.const';

@Injectable()
export class WrapTokenFeesService {
  calculateFee({ tokenAmount }: CalculateFeeParams): CalculateFeeResponse {
    const amount = BigNumber.from(tokenAmount);

    const feeAmount = amount.mul(FEE_PERCENTAGE_BPS).div(10000);
    const amountAfterFee = amount.sub(feeAmount);

    return {
      feeAmount: feeAmount.toString(),
      amountAfterFee: amountAfterFee.toString(),
      feePercentageBps: FEE_PERCENTAGE_BPS,
    };
  }
}
