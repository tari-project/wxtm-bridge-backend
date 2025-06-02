import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import {
  TokensReceivedRequestDTO,
  ErrorUpdateRequestDTO,
  CreatingTransactionRequestDTO,
  TransactionCreatedRequestDTO,
  ExecutingTransactionRequestDTO,
  TransactionExecutedRequestDTO,
} from './wrap-token-transaction-m2m.dto';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { SuccessDTO } from '../dto/success.dto';

@Injectable()
export class WrapTokenTransactionM2MService extends TypeOrmCrudService<WrapTokenTransactionEntity> {
  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    repo: Repository<WrapTokenTransactionEntity>,
  ) {
    super(repo);
  }

  async updateToTokensReceived({
    walletTransactions,
  }: TokensReceivedRequestDTO): Promise<SuccessDTO> {
    for (const walletTransaction of walletTransactions) {
      const transaction = await this.repo.findOne({
        where: {
          paymentId: walletTransaction.paymentId,
          status: In([
            WrapTokenTransactionStatus.CREATED,
            WrapTokenTransactionStatus.TOKENS_SENT,
            WrapTokenTransactionStatus.TIMEOUT,
          ]),
          tariPaymentIdHex: IsNull(),
          tariTxTimestamp: IsNull(),
        },
      });

      if (transaction) {
        const amountMatches =
          transaction.tokenAmount === walletTransaction.amount;

        await this.repo.update(
          {
            id: transaction.id,
          },
          {
            tariPaymentIdHex: walletTransaction.tariPaymentIdHex,
            tariTxTimestamp: walletTransaction.timestamp
              ? Number(walletTransaction.timestamp)
              : undefined,
            status: amountMatches
              ? WrapTokenTransactionStatus.TOKENS_RECEIVED
              : WrapTokenTransactionStatus.TOKENS_RECEIVED_WITH_MISMATCH,
            tokenAmountInWallet: walletTransaction.amount,
          },
        );
      }
    }

    return {
      success: true,
    };
  }

  async updateToCreatingTransaction({
    walletTransactions,
  }: CreatingTransactionRequestDTO): Promise<SuccessDTO> {
    for (const transaction of walletTransactions) {
      await this.repo.update(
        {
          paymentId: transaction.paymentId,
          status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
          tariPaymentIdHex: Not(IsNull()),
        },
        {
          status: WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
        },
      );
    }

    return {
      success: true,
    };
  }

  async updateToTransactionCreated({
    walletTransactions,
  }: TransactionCreatedRequestDTO): Promise<SuccessDTO> {
    for (const transaction of walletTransactions) {
      await this.repo.update(
        {
          paymentId: transaction.paymentId,
          status: WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
          tariPaymentIdHex: Not(IsNull()),
        },
        {
          status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
          safeTxHash: transaction.safeTxHash,
          safeNonce: transaction.safeNonce,
        },
      );
    }

    return {
      success: true,
    };
  }

  async updateToExecutingTransaction({
    walletTransactions,
  }: ExecutingTransactionRequestDTO): Promise<SuccessDTO> {
    for (const transaction of walletTransactions) {
      await this.repo.update(
        {
          paymentId: transaction.paymentId,
          status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
          tariPaymentIdHex: Not(IsNull()),
          safeTxHash: Not(IsNull()),
        },
        {
          status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
        },
      );
    }

    return {
      success: true,
    };
  }

  async updateToTransactionExecuted({
    walletTransactions,
  }: TransactionExecutedRequestDTO): Promise<SuccessDTO> {
    for (const transaction of walletTransactions) {
      await this.repo.update(
        {
          paymentId: transaction.paymentId,
          status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
          tariPaymentIdHex: Not(IsNull()),
          safeTxHash: Not(IsNull()),
        },
        {
          status: WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED,
        },
      );
    }

    return {
      success: true,
    };
  }

  async setCurrentError({
    walletTransactions,
  }: ErrorUpdateRequestDTO): Promise<SuccessDTO> {
    for (const transaction of walletTransactions) {
      await this.repo.update(
        {
          paymentId: transaction.paymentId,
          error: IsNull(),
        },
        {
          error: transaction.error,
        },
      );
    }

    return {
      success: true,
    };
  }
}
