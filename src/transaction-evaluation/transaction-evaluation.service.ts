import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { NotificationsService } from '../notifications/notifications.service';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { TokensUnwrappedStatus } from '../tokens-unwrapped/tokens-unwrapped.const';
import { TokensUnwrappedAuditService } from '../tokens-unwrapped-audit/tokens-unwrapped-audit.service';
import { SetTransactionToUnprocessableParams } from './transaction-evaluation.interface';

@Injectable()
export class TransactionEvaluationService {
  private readonly maxErrorsThreshold = 5;

  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    private readonly wrapTokenTransactionRepository: Repository<WrapTokenTransactionEntity>,
    @InjectRepository(TokensUnwrappedEntity)
    private readonly tokensUnwrappedRepository: Repository<TokensUnwrappedEntity>,
    private readonly notificationService: NotificationsService,
    private readonly tokensUnwrappedAuditService: TokensUnwrappedAuditService,
  ) {}

  private async evaluateProposeSafeTransactionErrors(
    transaction: WrapTokenTransactionEntity,
  ): Promise<boolean> {
    if (
      (transaction.status === WrapTokenTransactionStatus.TOKENS_RECEIVED ||
        transaction.status ===
          WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION) &&
      transaction.error.length > 0
    ) {
      await this.wrapTokenTransactionRepository.update(transaction.id, {
        status:
          WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION_UNPROCESSABLE,
        isNotificationSent: true,
      });

      if (!transaction.isNotificationSent) {
        await this.notificationService.sendWrapTokensTransactionUnprocessableNotification(
          transaction.id,
        );
      }

      return true;
    }

    return false;
  }

  private async evaluateExecutingSafeTransactionErrors(
    transaction: WrapTokenTransactionEntity,
  ): Promise<boolean> {
    if (
      transaction.status ===
        WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION &&
      transaction.error.length > 0
    ) {
      await this.wrapTokenTransactionRepository.update(transaction.id, {
        status: WrapTokenTransactionStatus.SAFE_TRANSACTION_UNPROCESSABLE,
        isNotificationSent: true,
      });

      if (!transaction.isNotificationSent) {
        await this.notificationService.sendWrapTokensTransactionUnprocessableNotification(
          transaction.id,
        );
      }

      return true;
    }

    return false;
  }

  private async evaluateRemainingWrapTokenTransactionErrors(
    transaction: WrapTokenTransactionEntity,
  ): Promise<void> {
    if (
      transaction.status ===
        WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED &&
      transaction.error.length >= this.maxErrorsThreshold
    ) {
      await this.wrapTokenTransactionRepository.update(transaction.id, {
        status: WrapTokenTransactionStatus.SAFE_TRANSACTION_UNPROCESSABLE,
        isNotificationSent: true,
      });

      if (!transaction.isNotificationSent) {
        await this.notificationService.sendWrapTokensTransactionUnprocessableNotification(
          transaction.id,
        );
      }
    }
  }

  async evaluateWrapTokenErrors(transactionId: number): Promise<void> {
    const transaction = await this.wrapTokenTransactionRepository.findOneOrFail(
      {
        where: {
          id: transactionId,
        },
      },
    );

    const isProposalErrorHandled =
      await this.evaluateProposeSafeTransactionErrors(transaction);

    if (isProposalErrorHandled) {
      return;
    }

    const isExecutionErrorHandled =
      await this.evaluateExecutingSafeTransactionErrors(transaction);

    if (isExecutionErrorHandled) {
      return;
    }

    await this.evaluateRemainingWrapTokenTransactionErrors(transaction);
  }

  private async setTransactionToUnprocessable({
    transaction,
    unprocessableStatus,
    errorThreshold,
  }: SetTransactionToUnprocessableParams): Promise<void> {
    if (transaction.error.length < errorThreshold) {
      return;
    }

    await this.tokensUnwrappedRepository.update(
      {
        id: transaction.id,
        status: transaction.status,
      },
      {
        status: unprocessableStatus,
        isErrorNotificationSent: true,
      },
    );

    await this.tokensUnwrappedAuditService.recordTransactionEvent({
      transactionId: transaction.id,
      paymentId: transaction.paymentId,
      fromStatus: transaction.status,
      toStatus: unprocessableStatus,
    });

    if (!transaction.isErrorNotificationSent) {
      await this.notificationService.sendTokensUnwrappedUnprocessableNotification(
        transaction.id,
      );
    }
  }

  async evaluateTokensUnwrappedErrors(id: number): Promise<void> {
    const transaction = await this.tokensUnwrappedRepository.findOneOrFail({
      where: {
        id,
      },
    });

    switch (transaction.status) {
      case TokensUnwrappedStatus.CREATED:
        await this.setTransactionToUnprocessable({
          transaction,
          unprocessableStatus: TokensUnwrappedStatus.CREATED_UNPROCESSABLE,
          errorThreshold: 1,
        });

        break;

      case TokensUnwrappedStatus.AWAITING_CONFIRMATION:
        await this.setTransactionToUnprocessable({
          transaction,
          unprocessableStatus:
            TokensUnwrappedStatus.AWAITING_CONFIRMATION_UNPROCESSABLE,
          errorThreshold: 1,
        });
        break;

      case TokensUnwrappedStatus.CONFIRMED:
      case TokensUnwrappedStatus.INIT_SEND_TOKENS:
        await this.setTransactionToUnprocessable({
          transaction,
          unprocessableStatus: TokensUnwrappedStatus.CONFIRMED_UNPROCESSABLE,
          errorThreshold: 1,
        });
        break;

      case TokensUnwrappedStatus.SENDING_TOKENS:
        await this.setTransactionToUnprocessable({
          transaction,
          unprocessableStatus:
            TokensUnwrappedStatus.SENDING_TOKENS_UNPROCESSABLE,
          errorThreshold: 1,
        });
    }
  }
}
