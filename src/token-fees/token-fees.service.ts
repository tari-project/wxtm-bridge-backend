import { Injectable } from '@nestjs/common';
import { BigNumber } from 'ethers';
import { ConfigService } from '@nestjs/config';

import { CalculateFeeParams, CalculateFeeResponse } from './token-fees.types';
import { IConfig } from '../config/config.interface';

@Injectable()
export class TokenFeesService {
  constructor(protected readonly configService: ConfigService<IConfig, true>) {}

  calculateWrapFee({ tokenAmount }: CalculateFeeParams): CalculateFeeResponse {
    const { wrapTokenFeePercentageBps } = this.configService.get('fees', {
      infer: true,
    });

    return this.calculateFee(tokenAmount, wrapTokenFeePercentageBps);
  }

  calculateUnwrapFee({
    tokenAmount,
  }: CalculateFeeParams): CalculateFeeResponse {
    const { tokensUnwrapFeePercentageBps } = this.configService.get('fees', {
      infer: true,
    });

    return this.calculateFee(tokenAmount, tokensUnwrapFeePercentageBps);
  }

  private calculateFee(
    tokenAmount: string,
    feePercentageBps: number,
  ): CalculateFeeResponse {
    const amount = BigNumber.from(tokenAmount);

    const feeAmount = amount.mul(feePercentageBps).div(10000);
    const amountAfterFee = amount.sub(feeAmount);

    return {
      feeAmount: feeAmount.toString(),
      amountAfterFee: amountAfterFee.toString(),
      feePercentageBps,
    };
  }
}
