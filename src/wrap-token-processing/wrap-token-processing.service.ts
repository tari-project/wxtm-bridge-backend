import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';

import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { TokensReceivedDTO } from './wrap-token-processing.dto';
import { WrapTokenAuditService } from '../wrap-token-audit/wrap-token-audit.service';

@Injectable()
export class WrapTokenProcessingService {
  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    private readonly transactionRepository: Repository<WrapTokenTransactionEntity>,
    private readonly wrapTokenAuditService: WrapTokenAuditService,
  ) {}

  async onTokensReceived({ amount, paymentId, timestamp }: TokensReceivedDTO) {
    const transaction = await this.transactionRepository.findOne({
      where: {
        paymentId,
        status: In([
          WrapTokenTransactionStatus.CREATED,
          WrapTokenTransactionStatus.TOKENS_SENT,
          WrapTokenTransactionStatus.TIMEOUT,
        ]),
        tariTxTimestamp: IsNull(),
      },
    });

    if (transaction) {
      const newStatus =
        transaction.tokenAmount === amount
          ? WrapTokenTransactionStatus.TOKENS_RECEIVED
          : WrapTokenTransactionStatus.TOKENS_RECEIVED_WITH_MISMATCH;

      await this.transactionRepository.update(
        {
          id: transaction.id,
        },
        {
          tariTxTimestamp: timestamp,
          status: newStatus,
          tokenAmountInWallet: amount,
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
}
