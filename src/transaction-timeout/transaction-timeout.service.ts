import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThan, Repository } from 'typeorm';
import { EventBridgeEvent } from 'aws-lambda';
import { ConfigService } from '@nestjs/config';

import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { IConfig } from '../config/config.interface';
import { WrapTokenAuditService } from '../wrap-token-audit/wrap-token-audit.service';

@Injectable()
export class TransactionTimeoutService {
  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    private wrapTokenTransactionEntity: Repository<WrapTokenTransactionEntity>,
    protected readonly configService: ConfigService<IConfig, true>,
    private readonly wrapTokenAuditService: WrapTokenAuditService,
  ) {}

  getDateTimeNow(): Date {
    return new Date(Date.now());
  }

  async onEventReceived(_event: EventBridgeEvent<any, any>): Promise<void> {
    const transactionTimeout = this.configService.get('transactionTimeout', {
      infer: true,
    });
    const now = this.getDateTimeNow();
    const timeAgo = new Date(now.getTime() - transactionTimeout);

    const transactions = await this.wrapTokenTransactionEntity.find({
      where: {
        status: In([
          WrapTokenTransactionStatus.CREATED,
          WrapTokenTransactionStatus.TOKENS_SENT,
        ]),
        tariPaymentIdHex: IsNull(),
        tariTxTimestamp: IsNull(),
        updatedAt: LessThan(timeAgo),
      },
    });

    for (const transaction of transactions) {
      await this.wrapTokenTransactionEntity.update(
        {
          id: transaction.id,
        },
        {
          status: WrapTokenTransactionStatus.TIMEOUT,
        },
      );

      await this.wrapTokenAuditService.recordTransactionEvent({
        transactionId: transaction.id,
        paymentId: transaction.paymentId,
        fromStatus: transaction.status,
        toStatus: WrapTokenTransactionStatus.TIMEOUT,
      });
    }
  }
}
