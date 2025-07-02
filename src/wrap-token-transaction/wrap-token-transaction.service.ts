import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { CrudRequest } from '@dataui/crud';

import { WrapTokenTransactionEntity } from './wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from './wrap-token-transaction.const';

@Injectable()
export class WrapTokenTransactionService extends TypeOrmCrudService<WrapTokenTransactionEntity> {
  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    repo: Repository<WrapTokenTransactionEntity>,
  ) {
    super(repo);
  }

  async updateOne(req: CrudRequest): Promise<WrapTokenTransactionEntity> {
    const transaction = await super.getOne(req);

    if (
      transaction.status ===
      WrapTokenTransactionStatus.CREATING_SAFE_TRANSACTION_UNPROCESSABLE
    ) {
      return super.updateOne(req, {
        status: WrapTokenTransactionStatus.TOKENS_RECEIVED,
        error: [],
        isNotificationSent: false,
      });
    }

    if (
      transaction.status ===
      WrapTokenTransactionStatus.SAFE_TRANSACTION_UNPROCESSABLE
    ) {
      return super.updateOne(req, {
        status: WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED,
        error: [],
        isNotificationSent: false,
      });
    }

    return transaction;
  }
}
