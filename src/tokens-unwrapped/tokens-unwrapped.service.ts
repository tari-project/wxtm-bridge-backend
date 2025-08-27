import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

import { TokensUnwrappedEntity } from './tokens-unwrapped.entity';
import { TokensUnwrappedStatus } from './tokens-unwrapped.const';
import { SuccessDTO } from '../dto/success.dto';

@Injectable()
export class TokensUnwrappedService extends TypeOrmCrudService<TokensUnwrappedEntity> {
  constructor(
    @InjectRepository(TokensUnwrappedEntity)
    repo: Repository<TokensUnwrappedEntity>,
  ) {
    super(repo);
  }

  async approveTransaction(id: number, userId: number): Promise<SuccessDTO> {
    const transaction = await this.repo.update(
      {
        id,
        status: TokensUnwrappedStatus.CONFIRMED_AWAITING_APPROVAL,
      },
      { status: TokensUnwrappedStatus.CONFIRMED, approvingUserId: userId },
    );

    return { success: !!transaction?.affected };
  }
}
