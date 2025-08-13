import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';

@Injectable()
export class TokensUnwrappedM2MService extends TypeOrmCrudService<TokensUnwrappedEntity> {
  constructor(
    @InjectRepository(TokensUnwrappedEntity)
    repo: Repository<TokensUnwrappedEntity>,
  ) {
    super(repo);
  }
}
