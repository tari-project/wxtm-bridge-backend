import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentWalletBalanceEntity } from './payment-wallet-balance.entity';
import {
  PaymentWalletBalanceDTO,
  PaymentWalletBalanceResponseDTO,
} from './payment-wallet-balance.dto';
import { SuccessDTO } from '../dto/success.dto';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { TokensUnwrappedStatus } from '../tokens-unwrapped/tokens-unwrapped.const';
import { convertTokenFrom18ToWxtmDecimals } from '../utils/convert-token-from-18-to-wxtm-decimals';

@Injectable()
export class PaymentWalletBalanceService {
  constructor(
    @InjectRepository(PaymentWalletBalanceEntity)
    private readonly paymentWalletBalanceRepository: Repository<PaymentWalletBalanceEntity>,
    @InjectRepository(TokensUnwrappedEntity)
    private readonly tokensUnwrappedRepository: Repository<TokensUnwrappedEntity>,
  ) {}

  async setBalance({
    availableBalance,
    pendingIncomingBalance,
    pendingOutgoingBalance,
    timelockedBalance,
  }: PaymentWalletBalanceDTO): Promise<SuccessDTO> {
    const { id } = await this.paymentWalletBalanceRepository.findOneByOrFail({
      id: 1,
    });

    await this.paymentWalletBalanceRepository.update(id, {
      availableBalance,
      pendingIncomingBalance,
      pendingOutgoingBalance,
      timelockedBalance,
    });

    return { success: true };
  }

  private async getWalletBalance(): Promise<bigint> {
    const { availableBalance, pendingIncomingBalance } =
      await this.paymentWalletBalanceRepository.findOneByOrFail({
        id: 1,
      });

    return BigInt(availableBalance) + BigInt(pendingIncomingBalance);
  }

  private async getPendingTransactionsAmount(): Promise<bigint> {
    const transactionSumResult = await this.tokensUnwrappedRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amountAfterFee)', 'total')
      .where('transaction.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [
          TokensUnwrappedStatus.INIT_SEND_TOKENS,
          TokensUnwrappedStatus.SENDING_TOKENS,
          TokensUnwrappedStatus.TOKENS_SENT,
          TokensUnwrappedStatus.SENDING_TOKENS_UNPROCESSABLE,
        ],
      })
      .getRawOne<{ total: string }>();

    const sumResults6Decimals = convertTokenFrom18ToWxtmDecimals({
      tokenAmount: transactionSumResult?.total ?? '0',
    });

    return BigInt(sumResults6Decimals);
  }

  async getBalances(): Promise<PaymentWalletBalanceResponseDTO> {
    const walletBalance = await this.getWalletBalance();
    const pendingTransactionsAmount = await this.getPendingTransactionsAmount();

    const availableWalletBalance = walletBalance - pendingTransactionsAmount;

    return {
      walletBalance: walletBalance.toString(),
      pendingTransactionsAmount: pendingTransactionsAmount.toString(),
      availableWalletBalance: availableWalletBalance.toString(),
    };
  }
}
