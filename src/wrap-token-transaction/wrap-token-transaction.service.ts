import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { CrudRequest } from '@dataui/crud';

import { WrapTokenTransactionEntity } from './wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from './wrap-token-transaction.const';
import { ExceptionsMessages } from '../consts/exceptions-messages';
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
      transaction.status === WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED
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

    if (dto.safeNonce && dto.safeTxHash) {
      dto.status = WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED;
    }

    return super.updateOne(req, dto);
  }
}
