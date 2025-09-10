import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ethers } from 'ethers';
import * as Sentry from '@sentry/nestjs';

import { IConfig } from '../config/config.interface';
import {
  MineToExchangeConfigRespDTO,
  MiningTransactionDTO,
} from './mine-to-exchange.dto';
import { TokenFeesService } from '../token-fees/token-fees.service';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenAuditService } from '../wrap-token-audit/wrap-token-audit.service';
import {
  WrapTokenTransactionOrigin,
  WrapTokenTransactionStatus,
} from '../wrap-token-transaction/wrap-token-transaction.const';
import { CreateMiningTransactionParams } from './mine-to-exchange.interface';
import { SuccessDTO } from '../dto/success.dto';
import { AggregateTransactionsService } from '../aggregate-transactions/aggregate-transactions.service';

@Injectable()
export class MineToExchangeService {
  private readonly logger = new Logger(MineToExchangeService.name);

  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    private readonly wrapTokenTransactionRepository: Repository<WrapTokenTransactionEntity>,
    private readonly configService: ConfigService<IConfig, true>,
    private readonly tokenFeesService: TokenFeesService,
    private readonly wrapTokenAuditService: WrapTokenAuditService,
    private readonly aggregateTransactionsService: AggregateTransactionsService,
  ) {}

  async getConfig(toAddress: string): Promise<MineToExchangeConfigRespDTO> {
    const { addressPrefix, walletAddress } = this.configService.get(
      'mineToExchange',
      { infer: true },
    );

    return {
      walletAddress,
      paymentId: `${addressPrefix}:${toAddress}`,
    };
  }

  private parseUserPaymentId(paymentId?: string): string | undefined {
    const { addressPrefix } = this.configService.get('mineToExchange', {
      infer: true,
    });

    try {
      if (!paymentId) {
        return;
      }

      const parts = paymentId.split(':');

      if (parts.length !== 2) {
        throw new BadRequestException(
          `Invalid user payment ID format: ${paymentId}`,
        );
      }

      if (parts[0] !== addressPrefix) {
        throw new BadRequestException(
          `Invalid address prefix in user payment ID ${addressPrefix}`,
        );
      }

      if (!ethers.utils.isAddress(parts[1])) {
        throw new BadRequestException(`Invalid Ethereum address ${parts[1]}`);
      }

      return parts[1];
    } catch (e) {
      this.logger.error(e);
      Sentry.captureException(e);

      return;
    }
  }

  private validateMinAmount(tokenAmount: string): boolean {
    const { minTokenAmount } = this.configService.get('mineToExchange', {
      infer: true,
    });

    return ethers.utils
      .parseUnits(tokenAmount, 0)
      .gte(ethers.utils.parseUnits(minTokenAmount, 0));
  }

  async createMiningTransaction({
    from,
    to,
    amount,
    paymentReference,
    blockHeight,
    timestamp,
    paymentId,
    status,
  }: CreateMiningTransactionParams): Promise<WrapTokenTransactionEntity> {
    const { amountAfterFee, feeAmount, feePercentageBps } =
      this.tokenFeesService.calculateWrapFee({
        tokenAmount: amount,
      });

    const transaction = await this.wrapTokenTransactionRepository.save({
      from,
      to,
      tokenAmount: amount,
      feePercentageBps,
      feeAmount,
      amountAfterFee,
      status,
      origin: WrapTokenTransactionOrigin.MININING,
      tariPaymentReference: paymentReference,
      tariBlockHeight: blockHeight,
      tariTxTimestamp: timestamp,
      incomingPaymentId: paymentId,
    });

    await this.wrapTokenAuditService.recordTransactionEvent({
      transactionId: transaction.id,
      paymentId: transaction.paymentId,
      toStatus: status,
    });

    return transaction;
  }

  private async handleCreateMiningTransaction({
    from,
    amount,
    paymentId,
    paymentReference,
    blockHeight,
    timestamp,
  }: MiningTransactionDTO) {
    const to = this.parseUserPaymentId(paymentId);
    const isMinAmount = this.validateMinAmount(amount);

    if (to && isMinAmount) {
      const tokensReceiveidTransaction = await this.createMiningTransaction({
        from,
        to,
        amount,
        paymentReference,
        blockHeight,
        timestamp,
        paymentId,
        status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
      });

      await this.aggregateTransactionsService.aggregateDustWithMainTransaction(
        tokensReceiveidTransaction,
      );

      return;
    }

    if (to && !isMinAmount) {
      const tokensReceivedBelowAmountTransaction =
        await this.createMiningTransaction({
          from,
          to,
          amount,
          paymentReference,
          blockHeight,
          timestamp,
          paymentId,
          status:
            WrapTokenTransactionStatus.MINING_TOKENS_RECEIVED_BELOW_MIN_AMOUNT,
        });

      await this.aggregateTransactionsService.aggregateDustTransactions(
        tokensReceivedBelowAmountTransaction.to,
      );

      return;
    }

    if (!to && isMinAmount) {
      await this.createMiningTransaction({
        from,
        to: 'not_provided',
        amount,
        paymentReference,
        blockHeight,
        timestamp,
        paymentId,
        status: WrapTokenTransactionStatus.MINING_INCORRECT_PAYMENT_ID,
      });

      return;
    }

    if (!to && !isMinAmount) {
      await this.createMiningTransaction({
        from,
        to: 'not_provided',
        amount,
        paymentReference,
        blockHeight,
        timestamp,
        paymentId,
        status:
          WrapTokenTransactionStatus.MINING_INCORRECT_PAYMENT_ID_AND_AMOUNT,
      });

      return;
    }
  }

  async createMiningTransactions(
    transactions: MiningTransactionDTO[],
  ): Promise<SuccessDTO> {
    for (const transaction of transactions) {
      const existingTransaction =
        await this.wrapTokenTransactionRepository.findOne({
          where: {
            tariPaymentReference: transaction.paymentReference,
          },
        });

      if (existingTransaction) {
        continue;
      }

      await this.handleCreateMiningTransaction(transaction);
    }

    return { success: true };
  }
}
