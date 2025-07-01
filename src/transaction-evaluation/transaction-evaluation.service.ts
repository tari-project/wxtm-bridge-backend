import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TransactionEvaluationService {
  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    private readonly transactionRepository: Repository<WrapTokenTransactionEntity>,
    private readonly notificationService: NotificationsService,
  ) {}

  async evaluateProposeSafeTransactionErrors(
    transaction: WrapTokenTransactionEntity,
  ): Promise<boolean> {
    if (
      (transaction.status === WrapTokenTransactionStatus.TOKENS_RECEIVED ||
        transaction.status ===
          WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION) &&
      transaction.error.length > 0
    ) {
      await this.transactionRepository.update(transaction.id, {
        status:
          WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION_UNPROCESSABLE,
        isNotificationSent: true,
      });

      if (!transaction.isNotificationSent) {
        await this.notificationService.sendTransactionUnprocessableNotification(
          transaction.id,
        );
      }

      return true;
    }

    return false;
  }

  async evaluateExecutingSafeTransactionErrors(
    transaction: WrapTokenTransactionEntity,
  ): Promise<boolean> {
    if (
      transaction.status ===
        WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION &&
      transaction.error.length > 0
    ) {
      await this.transactionRepository.update(transaction.id, {
        status: WrapTokenTransactionStatus.SAFE_TRANSACTION_UNPROCESSABLE,
        isNotificationSent: true,
      });

      if (!transaction.isNotificationSent) {
        await this.notificationService.sendTransactionUnprocessableNotification(
          transaction.id,
        );
      }

      return true;
    }

    return false;
  }

  async evaluateRemainingTransactionErrors(
    transaction: WrapTokenTransactionEntity,
  ): Promise<boolean> {
    if (
      transaction.status === WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED
    ) {
      await this.transactionRepository.update(transaction.id, {
        status: WrapTokenTransactionStatus.SAFE_TRANSACTION_UNPROCESSABLE,
        isNotificationSent: true,
      });

      if (!transaction.isNotificationSent) {
        await this.notificationService.sendTransactionUnprocessableNotification(
          transaction.id,
        );
      }

      return true;
    }

    return false;
  }

  async evaluateErrors(transactionId: number): Promise<void> {
    const transaction = await this.transactionRepository.findOneOrFail({
      where: {
        id: transactionId,
      },
    });

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

    if (transaction.error.length >= 5) {
      await this.evaluateRemainingTransactionErrors(transaction);
    }
  }
}
