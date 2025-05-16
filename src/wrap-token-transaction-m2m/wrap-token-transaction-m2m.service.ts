import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { TokensReceivedRequestDTO } from './wrap-token-transaction-m2m.dto';
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
    tokenTransactions,
  }: TokensReceivedRequestDTO): Promise<SuccessDTO> {
    for (const transaction of tokenTransactions) {
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
}
