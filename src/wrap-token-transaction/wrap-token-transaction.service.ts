import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { CrudRequest } from '@dataui/crud';

import { WrapTokenTransactionEntity } from './wrap-token-transaction.entity';

@Injectable()
export class WrapTokenTransactionService extends TypeOrmCrudService<WrapTokenTransactionEntity> {
  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    repo: Repository<WrapTokenTransactionEntity>,
  ) {
    super(repo);
  }

  async updateOne(req: CrudRequest): Promise<WrapTokenTransactionEntity> {
    return super.updateOne(req, { error: null });
  }
}
