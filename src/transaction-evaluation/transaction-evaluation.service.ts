import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { NotificationsService } from '../notifications/notifications.service';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { TokensUnwrappedStatus } from '../tokens-unwrapped/tokens-unwrapped.const';

@Injectable()
export class TransactionEvaluationService {
  private readonly maxErrorsThreshold = 5;

  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    private readonly wrapTokenTransactionRepository: Repository<WrapTokenTransactionEntity>,
    @InjectRepository(TokensUnwrappedEntity)
    private readonly tokensUnwrappedRepository: Repository<TokensUnwrappedEntity>,
    private readonly notificationService: NotificationsService,
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

  async evaluateTokensUnwrappedErrors(id: number): Promise<void> {
    const transaction = await this.tokensUnwrappedRepository.findOneOrFail({
      where: {
        id,
      },
    });

    if (transaction.error.length >= this.maxErrorsThreshold) {
      await this.tokensUnwrappedRepository.update(
        {
          id: transaction.id,
          status: Not(TokensUnwrappedStatus.UNPROCESSABLE),
        },
        {
          status: TokensUnwrappedStatus.UNPROCESSABLE,
          isErrorNotificationSent: true,
        },
      );

      if (!transaction.isErrorNotificationSent) {
        await this.notificationService.sendTokensUnwrappedUnprocessableNotification(
          transaction.id,
        );
      }
    }
  }
}
