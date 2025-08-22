import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import {
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
import { verifyUpdateApplied } from '../helpers/verifyUpdateApplied';

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

  private async updateNewTransaction(
    { status, id, tokenAmount, paymentId }: WrapTokenTransactionEntity,
    {
      timestamp,
      blockHeight,
      paymentReference,
      amount,
      paymentId: incomingPaymentId,
    }: WalletTransactionDTO,
  ) {
    const newStatus =
      tokenAmount === amount
        ? WrapTokenTransactionStatus.TOKENS_RECEIVED
        : WrapTokenTransactionStatus.TOKENS_RECEIVED_WITH_MISMATCH;

    const updateResults = await this.repo.update(
      {
        id,
        status: In([
          WrapTokenTransactionStatus.CREATED,
          WrapTokenTransactionStatus.TOKENS_SENT,
          WrapTokenTransactionStatus.TIMEOUT,
        ]),
      },
      {
        tariTxTimestamp: timestamp,
        tariBlockHeight: blockHeight,
        tariPaymentReference: paymentReference,
        incomingPaymentId,
        tokenAmountInWallet: amount,
        status: newStatus,
      },
    );
    verifyUpdateApplied(updateResults);

    await this.wrapTokenAuditService.recordTransactionEvent({
      transactionId: id,
      paymentId,
      fromStatus: status,
      toStatus: newStatus,
    });
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
          tariPaymentReference: IsNull(),
          tariBlockHeight: IsNull(),
          tariTxTimestamp: IsNull(),
        },
      });

      if (!transaction) {
        continue;
      }

      await this.updateNewTransaction(transaction, walletTransaction);
    }

    return {
      success: true,
    };
  }

  private validateRegularAndAggregateTransactions(
    transaction: WrapTokenTransactionEntity,
  ) {
    if (transaction.aggregatedTransactions.length === 0) {
      if (
        !transaction.tariPaymentReference ||
        !transaction.tariBlockHeight ||
        !transaction.tariTxTimestamp
      ) {
        throw new BadRequestException(
          `Transaction with paymentId ${transaction.paymentId} has incomplete Tari data`,
        );
      }

      return;
    }

    transaction.aggregatedTransactions.forEach((aggregatedTransaction) => {
      if (
        !aggregatedTransaction.tariPaymentReference ||
        !aggregatedTransaction.tariBlockHeight ||
        !aggregatedTransaction.tariTxTimestamp
      ) {
        throw new BadRequestException(
          `Aggregated transaction with paymentId ${aggregatedTransaction.paymentId} has incomplete Tari data`,
        );
      }

      if (
        aggregatedTransaction.status !==
        WrapTokenTransactionStatus.REPLACED_BY_AGGREGATED
      ) {
        throw new BadRequestException(
          `Aggregated transaction with paymentId ${aggregatedTransaction.paymentId} is not in REPLACED_BY_AGGREGATED status`,
        );
      }
    });
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
        relations: ['aggregatedTransactions'],
      });

      if (!transaction) {
        throw new BadRequestException(
          `Transaction with paymentId ${walletTransaction.paymentId} not found`,
        );
      }
      this.validateRegularAndAggregateTransactions(transaction);

      const updateResults = await this.repo.update(
        {
          id: transaction.id,
          status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
        },
        {
          status: WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
        },
      );
      verifyUpdateApplied(updateResults);

      await this.wrapTokenAuditService.recordTransactionEvent({
        transactionId: transaction.id,
        paymentId: transaction.paymentId,
        fromStatus: transaction.status,
        toStatus: WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
      });
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
        relations: ['aggregatedTransactions'],
      });

      if (!transaction) {
        throw new BadRequestException(
          `Transaction with paymentId ${walletTransaction.paymentId} not found`,
        );
      }
      this.validateRegularAndAggregateTransactions(transaction);

      const updateResults = await this.repo.update(
        {
          id: transaction.id,
          status: WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
        },
        {
          status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
          safeTxHash: walletTransaction.safeTxHash,
          safeNonce: walletTransaction.safeNonce,
          safeAddress: walletTransaction.safeAddress,
        },
      );
      verifyUpdateApplied(updateResults);

      await this.wrapTokenAuditService.recordTransactionEvent({
        transactionId: transaction.id,
        paymentId: transaction.paymentId,
        fromStatus: transaction.status,
        toStatus: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
      });
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
        relations: ['aggregatedTransactions'],
      });

      if (!transaction) {
        throw new BadRequestException(
          `Transaction with paymentId ${walletTransaction.paymentId} not found`,
        );
      }
      this.validateRegularAndAggregateTransactions(transaction);

      const updateResults = await this.repo.update(
        {
          id: transaction.id,
          status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
        },
        {
          status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
        },
      );
      verifyUpdateApplied(updateResults);

      await this.wrapTokenAuditService.recordTransactionEvent({
        transactionId: transaction.id,
        paymentId: transaction.paymentId,
        fromStatus: transaction.status,
        toStatus: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
      });
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
        relations: ['aggregatedTransactions'],
      });

      if (!transaction) {
        throw new BadRequestException(
          `Transaction with paymentId ${walletTransaction.paymentId} not found`,
        );
      }
      this.validateRegularAndAggregateTransactions(transaction);

      const updateResults = await this.repo.update(
        {
          id: transaction.id,
          status: WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION,
        },
        {
          status: WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED,
          transactionHash: walletTransaction.transactionHash,
        },
      );
      verifyUpdateApplied(updateResults);

      await this.wrapTokenAuditService.recordTransactionEvent({
        transactionId: transaction.id,
        paymentId: transaction.paymentId,
        fromStatus: transaction.status,
        toStatus: WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED,
      });
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

        await this.transactionEvaluationService.evaluateWrapTokenErrors(
          transaction.id,
        );
      }
    }

    return {
      success: true,
    };
  }
}
