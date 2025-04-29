import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { CrudRequest } from '@dataui/crud';

import { WrapTokenTransactionEntity } from './wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from './wrap-token-transaction.const';
import { ExceptionsMessages } from '../consts/exceptions-messages';
import { SuccessDTO } from '../dto/success.dto';
import { UpdateWrapTokenTransactionDTO } from './wrap-token-transaction.dto';

@Injectable()
export class WrapTokenTransactionService extends TypeOrmCrudService<WrapTokenTransactionEntity> {
  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    repo: Repository<WrapTokenTransactionEntity>,
  ) {
    super(repo);
  }

  async updateOne(
    req: CrudRequest,
    dto: Partial<UpdateWrapTokenTransactionDTO>,
  ): Promise<WrapTokenTransactionEntity> {
    const transaction = await super.getOne(req);

    if (
      transaction.status === WrapTokenTransactionStatus.TOKENS_RECEIVED &&
      (dto.status !== WrapTokenTransactionStatus.TOKENS_RECEIVED ||
        dto.tokenAmount)
    ) {
      throw new BadRequestException(
        ExceptionsMessages.TRANSACTION_STATUS_INCORRECT,
      );
    }

    if (
      (transaction.safeNonce || transaction.safeTxHash) &&
      (dto.safeNonce || dto.safeTxHash)
    ) {
      throw new BadRequestException(
        ExceptionsMessages.TRANSACTION_NONCE_EXISTS,
      );
    }

    return super.updateOne(req, dto);
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
