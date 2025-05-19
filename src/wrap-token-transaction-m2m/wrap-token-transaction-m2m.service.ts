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
    wallelTransactions,
  }: TokensReceivedRequestDTO): Promise<SuccessDTO> {
    for (const transaction of wallelTransactions) {
      await this.repo.update(
        {
          paymentId: transaction.paymentId,
          status: In([
            WrapTokenTransactionStatus.CREATED,
            WrapTokenTransactionStatus.TOKENS_SENT,
          ]),
          tariTxId: IsNull(),
          tariTxTimestamp: IsNull(),
        },
        {
          tariTxId: transaction.txId,
          tokenAmount: transaction.amount,
          status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
          tariTxTimestamp: transaction.timestamp
            ? Number(transaction.timestamp)
            : undefined,
        },
      );
    }

    return {
      success: true,
    };
  }

  async updateToCreatingTransaction({
    wallelTransactions,
  }: CreatingTransactionRequestDTO): Promise<SuccessDTO> {
    for (const transaction of wallelTransactions) {
      await this.repo.update(
        {
          paymentId: transaction.paymentId,
          status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
          tariTxId: Not(IsNull()),
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
    wallelTransactions,
  }: TransactionCreatedRequestDTO): Promise<SuccessDTO> {
    for (const transaction of wallelTransactions) {
      await this.repo.update(
        {
          paymentId: transaction.paymentId,
          status: WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION,
          tariTxId: Not(IsNull()),
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

  async setCurrentError({
    wallelTransactions,
  }: ErrorUpdateRequestDTO): Promise<SuccessDTO> {
    for (const transaction of wallelTransactions) {
      await this.repo.update(
        {
          paymentId: transaction.paymentId,
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
