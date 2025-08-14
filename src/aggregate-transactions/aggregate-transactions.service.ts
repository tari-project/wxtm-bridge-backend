import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ethers } from 'ethers';

import { IConfig } from '../config/config.interface';
import { WrapTokenFeesService } from '../wrap-token-fees/wrap-token-fees.service';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenAuditService } from '../wrap-token-audit/wrap-token-audit.service';
import {
  WrapTokenTransactionOrigin,
  WrapTokenTransactionStatus,
} from '../wrap-token-transaction/wrap-token-transaction.const';

@Injectable()
export class AggregateTransactionsService {
  private readonly logger = new Logger(AggregateTransactionsService.name);

  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    private readonly wrapTokenTransactionRepository: Repository<WrapTokenTransactionEntity>,
    private readonly configService: ConfigService<IConfig, true>,
    private readonly wrapTokenFeesService: WrapTokenFeesService,
    private readonly wrapTokenAuditService: WrapTokenAuditService,
  ) {}

  private calculateCumulativeAmount(
    transactions: WrapTokenTransactionEntity[],
  ): string {
    const totalAmount = transactions.reduce((sum, transaction) => {
      const amount = ethers.utils.parseUnits(transaction.tokenAmount, 0);
      return sum.add(amount);
    }, ethers.BigNumber.from(0));

    return ethers.utils.formatUnits(totalAmount, 0);
  }

  private isMinAmountReached(tokenAmount: string): boolean {
    const minTokenAmount = this.configService.get(
      'mineToExchange.minTokenAmount',
      {
        infer: true,
      },
    );

    return ethers.utils
      .parseUnits(tokenAmount, 0)
      .gte(ethers.utils.parseUnits(minTokenAmount, 0));
  }

  async aggregateDustTransactions(to: string): Promise<void> {
    const dustTransactions = await this.wrapTokenTransactionRepository.find({
      where: {
        origin: WrapTokenTransactionOrigin.MININING,
        status:
          WrapTokenTransactionStatus.MINING_TOKENS_RECEIVED_BELOW_MIN_AMOUNT,
        to,
      },
    });

    if (dustTransactions.length <= 1) {
      return;
    }

    const tokenAmount = this.calculateCumulativeAmount(dustTransactions);

    if (!this.isMinAmountReached(tokenAmount)) {
      return;
    }

    const { amountAfterFee, feeAmount, feePercentageBps } =
      this.wrapTokenFeesService.calculateFee({ tokenAmount });

    const aggregatedTransaction =
      await this.wrapTokenTransactionRepository.manager.transaction(
        async (entityManager) => {
          const transaction = await entityManager.save(
            WrapTokenTransactionEntity,
            {
              from: 'aggregated_mining_transactions',
              to,
              origin: WrapTokenTransactionOrigin.MININING,
              status: WrapTokenTransactionStatus.TOKENS_RECEIVED_AGGREGATED,
              tokenAmount,
              feeAmount,
              amountAfterFee,
              feePercentageBps,
            },
          );

          for (const dustTransaction of dustTransactions) {
            await entityManager.update(
              WrapTokenTransactionEntity,
              dustTransaction.id,
              {
                status: WrapTokenTransactionStatus.REPLACED_BY_AGGREGATED,
                transactionId: transaction.id,
              },
            );
          }

          return transaction;
        },
      );

    await this.wrapTokenAuditService.recordTransactionEvent({
      transactionId: aggregatedTransaction.id,
      paymentId: aggregatedTransaction.paymentId,
      toStatus: aggregatedTransaction.status,
    });
  }
}
