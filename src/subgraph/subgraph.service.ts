import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventBridgeEvent } from 'aws-lambda';
import { SubgraphClientService } from './subgraph-client.service';

import { UserEntity } from '../user/user.entity';
import { TokensUnwrappedEntity } from './tokens-unwrapped.entity';

@Injectable()
export class SubgraphService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(TokensUnwrappedEntity)
    private tokensUnwrappedRepository: Repository<TokensUnwrappedEntity>,
    private subgraphClientService: SubgraphClientService,
  ) {}

  async onEventReceived(
    event: EventBridgeEvent<any, any>,
  ): Promise<TokensUnwrappedEntity[]> {
    const tokensUnwrapped =
      await this.subgraphClientService.getTokensUnwrapped();

    console.log('Subgraph Tokens: ', tokensUnwrapped);

    const savedTokens =
      await this.tokensUnwrappedRepository.save(tokensUnwrapped);
    console.log('Saved Tokens: ', savedTokens);

    const dbTokens = await this.tokensUnwrappedRepository.find();
    console.log('DB Tokens: ', dbTokens);

    return tokensUnwrapped;
  }
}
