import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { ConfigService } from '@nestjs/config';

import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import {
  TokensReceivedRequestDTO,
  ErrorUpdateRequestDTO,
  CreatingTransactionRequestDTO,
  TransactionCreatedRequestDTO,
  ExecutingTransactionRequestDTO,
  TransactionExecutedRequestDTO,
  SigningTransactionRequestDTO,
  TransactionSignedRequestDTO,
} from './wrap-token-transaction-m2m.dto';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { SuccessDTO } from '../dto/success.dto';
import { WrapTokenAuditService } from '../wrap-token-audit/wrap-token-audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { IConfig } from '../config/config.interface';

@Injectable()
export class WrapTokenTransactionM2MService extends TypeOrmCrudService<WrapTokenTransactionEntity> {
  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    repo: Repository<WrapTokenTransactionEntity>,
    private readonly wrapTokenAuditService: WrapTokenAuditService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService<IConfig, true>,
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

  async updateToCreatingTransaction({
    walletTransactions,
  }: CreatingTransactionRequestDTO): Promise<SuccessDTO> {
    for (const walletTransaction of walletTransactions) {
      const transaction = await this.repo.findOne({
        where: {
          paymentId: walletTransaction.paymentId,
          status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
          tariPaymentIdHex: Not(IsNull()),
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
          tariPaymentIdHex: Not(IsNull()),
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
          status: WrapTokenTransactionStatus.SAFE_TRANSACTION_SIGNED,
          tariPaymentIdHex: Not(IsNull()),
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
          tariPaymentIdHex: Not(IsNull()),
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

  private async notifyTransactionError(
    transactionId: number,
    errorMessage: string,
  ): Promise<void> {
    const domain = this.configService.get('domain', {
      infer: true,
    });

    await this.notificationsService.emitNotification({
      message: `Error processing transaction: https://admin.${domain}/wrap-token-transactions/edit/${transactionId}  Message: ${errorMessage}`,
      origin: 'Processor',
    });
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

      if (transaction && !transaction.error) {
        await this.repo.update(
          {
            id: transaction.id,
          },
          {
            error: walletTransaction.error,
          },
        );

        await this.wrapTokenAuditService.recordTransactionEvent({
          transactionId: transaction.id,
          paymentId: transaction.paymentId,
          fromStatus: transaction.status,
          note: walletTransaction.error,
        });

        await this.notifyTransactionError(
          transaction.id,
          JSON.stringify(walletTransaction.error),
        );
      }
    }

    return {
      success: true,
    };
  }

  async updateToSigningTransaction({
    walletTransactions,
  }: SigningTransactionRequestDTO): Promise<SuccessDTO> {
    for (const walletTransaction of walletTransactions) {
      const transaction = await this.repo.findOne({
        where: {
          paymentId: walletTransaction.paymentId,
          status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
          tariPaymentIdHex: Not(IsNull()),
          safeTxHash: Not(IsNull()),
        },
      });

      if (transaction) {
        await this.repo.update(
          {
            id: transaction.id,
          },
          {
            status: WrapTokenTransactionStatus.SIGNING_SAFE_TRANSACTION,
          },
        );

        await this.wrapTokenAuditService.recordTransactionEvent({
          transactionId: transaction.id,
          paymentId: transaction.paymentId,
          fromStatus: transaction.status,
          toStatus: WrapTokenTransactionStatus.SIGNING_SAFE_TRANSACTION,
        });
      }
    }

    return {
      success: true,
    };
  }

  async updateToTransactionSigned({
    walletTransactions,
  }: TransactionSignedRequestDTO): Promise<SuccessDTO> {
    for (const walletTransaction of walletTransactions) {
      const transaction = await this.repo.findOne({
        where: {
          paymentId: walletTransaction.paymentId,
          status: WrapTokenTransactionStatus.SIGNING_SAFE_TRANSACTION,
          tariPaymentIdHex: Not(IsNull()),
          safeTxHash: Not(IsNull()),
        },
      });

      if (transaction) {
        await this.repo.update(
          {
            id: transaction.id,
          },
          {
            status: WrapTokenTransactionStatus.SAFE_TRANSACTION_SIGNED,
          },
        );

        await this.wrapTokenAuditService.recordTransactionEvent({
          transactionId: transaction.id,
          paymentId: transaction.paymentId,
          fromStatus: transaction.status,
          toStatus: WrapTokenTransactionStatus.SAFE_TRANSACTION_SIGNED,
        });
      }
    }

    return {
      success: true,
    };
  }
}
