import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import {
  TokensReceivedRequestDTO_DELETE,
  ErrorUpdateRequestDTO,
  CreatingTransactionRequestDTO,
  TransactionCreatedRequestDTO,
  ExecutingTransactionRequestDTO,
  TransactionExecutedRequestDTO,
  TokensReceivedRequestDTO,
  WalletTransactionDTO,
} from './wrap-token-transaction-m2m.dto';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { SuccessDTO } from '../dto/success.dto';
import { WrapTokenAuditService } from '../wrap-token-audit/wrap-token-audit.service';
import { TransactionEvaluationService } from '../transaction-evaluation/transaction-evaluation.service';

@Injectable()
export class WrapTokenTransactionM2MService extends TypeOrmCrudService<WrapTokenTransactionEntity> {
  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    repo: Repository<WrapTokenTransactionEntity>,
    private readonly wrapTokenAuditService: WrapTokenAuditService,
    private readonly transactionEvaluationService: TransactionEvaluationService,
  ) {
    super(repo);
  }

  async updateToTokensReceived_DELETE({
    walletTransactions,
  }: TokensReceivedRequestDTO_DELETE): Promise<SuccessDTO> {
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
        const newStatus =
          transaction.tokenAmount === walletTransaction.amount
            ? WrapTokenTransactionStatus.TOKENS_RECEIVED
            : WrapTokenTransactionStatus.TOKENS_RECEIVED_WITH_MISMATCH;

        await this.repo.update(
          {
            id: transaction.id,
          },
          {
            tariPaymentIdHex: walletTransaction.tariPaymentIdHex,
            tariTxTimestamp: walletTransaction.timestamp
              ? Number(walletTransaction.timestamp)
              : undefined,
            status: newStatus,
            tokenAmountInWallet: walletTransaction.amount,
          },
        );

        await this.wrapTokenAuditService.recordTransactionEvent({
          transactionId: transaction.id,
          paymentId: transaction.paymentId,
          fromStatus: transaction.status,
          toStatus: newStatus,
        });
      }
    }

    return {
      success: true,
    };
  }

  private async updateNewTransaction(
    {
      status,
      id,
      tokenAmount,
      tariBlockHeight,
      tariTxTimestamp,
      tariPaymentReference,
      paymentId,
    }: WrapTokenTransactionEntity,
    { timestamp, blockHeight, paymentReference, amount }: WalletTransactionDTO,
  ) {
    if (
      status === WrapTokenTransactionStatus.CREATED ||
      status === WrapTokenTransactionStatus.TOKENS_SENT ||
      (status === WrapTokenTransactionStatus.TIMEOUT &&
        !tariBlockHeight &&
        !tariTxTimestamp &&
        !tariPaymentReference)
    ) {
      const newStatus =
        tokenAmount === amount
          ? WrapTokenTransactionStatus.TOKENS_RECEIVED
          : WrapTokenTransactionStatus.TOKENS_RECEIVED_WITH_MISMATCH;

      await this.repo.update(
        {
          id,
        },
        {
          tariTxTimestamp: timestamp,
          tariBlockHeight: blockHeight,
          tariPaymentReference: paymentReference,
          tokenAmountInWallet: amount,
          status: newStatus,
        },
      );

      await this.wrapTokenAuditService.recordTransactionEvent({
        transactionId: id,
        paymentId,
        fromStatus: status,
        toStatus: newStatus,
      });
    }
  }

  private async patchExistingTransactionWithWalletData(
    {
      status,
      id,
      tariBlockHeight,
      tariPaymentReference,
    }: WrapTokenTransactionEntity,
    { blockHeight, paymentReference }: WalletTransactionDTO,
  ) {
    if (
      status === WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED &&
      !tariBlockHeight &&
      !tariPaymentReference
    ) {
      await this.repo.update(
        {
          id,
        },
        {
          tariBlockHeight: blockHeight,
          tariPaymentReference: paymentReference,
        },
      );
    }
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
            WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED,
          ]),
        },
      });

      if (!transaction) {
        continue;
      }

      await this.updateNewTransaction(transaction, walletTransaction);
      await this.patchExistingTransactionWithWalletData(
        transaction,
        walletTransaction,
      );
    }

    return {
      success: true,
    };
  }

  async updateToCreatingTransaction({
    walletTransactions,
  }: CreatingTransactionRequestDTO): Promise<SuccessDTO> {
    for (const walletTransaction of walletTransactions) {
      const transaction = await this.repo.findOne({
        where: {
          paymentId: walletTransaction.paymentId,
          status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
        },
      });

      if (transaction) {
        await this.repo.update(
          {
            id: transaction.id,
          },
          {
            status: WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
          },
        );

        await this.wrapTokenAuditService.recordTransactionEvent({
          transactionId: transaction.id,
          paymentId: transaction.paymentId,
          fromStatus: transaction.status,
          toStatus: WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
        });
      }
    }

    return {
      success: true,
    };
  }

  async updateToTransactionCreated({
    walletTransactions,
  }: TransactionCreatedRequestDTO): Promise<SuccessDTO> {
    for (const walletTransaction of walletTransactions) {
      const transaction = await this.repo.findOne({
        where: {
          paymentId: walletTransaction.paymentId,
          status: WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
        },
      });

      if (transaction) {
        await this.repo.update(
          {
            id: transaction.id,
          },
          {
            status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
            safeTxHash: walletTransaction.safeTxHash,
            safeNonce: walletTransaction.safeNonce,
            safeAddress: walletTransaction.safeAddress,
          },
        );

        await this.wrapTokenAuditService.recordTransactionEvent({
          transactionId: transaction.id,
          paymentId: transaction.paymentId,
          fromStatus: transaction.status,
          toStatus: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
        });
      }
    }

    return {
      success: true,
    };
  }

  async updateToExecutingTransaction({
    walletTransactions,
  }: ExecutingTransactionRequestDTO): Promise<SuccessDTO> {
    for (const walletTransaction of walletTransactions) {
      const transaction = await this.repo.findOne({
        where: {
          paymentId: walletTransaction.paymentId,
          status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
          safeTxHash: Not(IsNull()),
        },
      });

      if (transaction) {
        await this.repo.update(
          {
            id: transaction.id,
          },
          {
            status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
          },
        );

        await this.wrapTokenAuditService.recordTransactionEvent({
          transactionId: transaction.id,
          paymentId: transaction.paymentId,
          fromStatus: transaction.status,
          toStatus: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
        });
      }
    }

    return {
      success: true,
    };
  }

  async updateToTransactionExecuted({
    walletTransactions,
  }: TransactionExecutedRequestDTO): Promise<SuccessDTO> {
    for (const walletTransaction of walletTransactions) {
      const transaction = await this.repo.findOne({
        where: {
          paymentId: walletTransaction.paymentId,
          status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
          safeTxHash: Not(IsNull()),
        },
      });

      if (transaction) {
        await this.repo.update(
          {
            id: transaction.id,
          },
          {
            status: WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED,
            transactionHash: walletTransaction.transactionHash,
          },
        );

        await this.wrapTokenAuditService.recordTransactionEvent({
          transactionId: transaction.id,
          paymentId: transaction.paymentId,
          fromStatus: transaction.status,
          toStatus: WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED,
        });
      }
    }

    return {
      success: true,
    };
  }

  async setCurrentError({
    walletTransactions,
  }: ErrorUpdateRequestDTO): Promise<SuccessDTO> {
    for (const walletTransaction of walletTransactions) {
      const transaction = await this.repo.findOne({
        where: {
          paymentId: walletTransaction.paymentId,
        },
      });

      if (transaction && transaction.error.length < 10) {
        await this.repo.update(
          {
            id: transaction.id,
          },
          {
            error: [...transaction.error, walletTransaction.error],
          },
        );

        await this.wrapTokenAuditService.recordTransactionEvent({
          transactionId: transaction.id,
          paymentId: transaction.paymentId,
          fromStatus: transaction.status,
          note: walletTransaction.error,
        });

        await this.transactionEvaluationService.evaluateErrors(transaction.id);
      }
    }

    return {
      success: true,
    };
  }
}
