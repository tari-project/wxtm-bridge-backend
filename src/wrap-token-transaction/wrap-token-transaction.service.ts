import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

import { WrapTokenTransactionEntity } from './wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from './wrap-token-transaction.const';
import { ExceptionsMessages } from '../consts/exceptions-messages';
import { SuccessDTO } from '../dto/success.dto';

@Injectable()
export class WrapTokenTransactionService extends TypeOrmCrudService<WrapTokenTransactionEntity> {
  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    repo: Repository<WrapTokenTransactionEntity>,
  ) {
    super(repo);
  }

  private async resolveTransactionById(
    id: string,
  ): Promise<WrapTokenTransactionEntity> {
    const transaction = await this.repo.findOne({ where: { id: Number(id) } });

    if (!transaction) {
      throw new BadRequestException(ExceptionsMessages.TRANSACTION_NOT_FOUND);
    }

    return transaction;
  }

  async updateToTokensSent(id: string): Promise<SuccessDTO> {
    const transaction = await this.resolveTransactionById(id);

    if (transaction.status !== WrapTokenTransactionStatus.CREATED) {
      throw new BadRequestException(
        ExceptionsMessages.TRANSACTION_STATUS_INCORRECT,
      );
    }

    await this.repo.save({
      ...transaction,
      status: WrapTokenTransactionStatus.TOKENS_SENT,
    });

    return {
      success: true,
    };
  }
}
