import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventBridgeEvent } from 'aws-lambda';
import { SubgraphClientService } from '../subgraph-client/subgraph-client.service';

import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';

@Injectable()
export class SubgraphService {
  constructor(
    @InjectRepository(TokensUnwrappedEntity)
    private tokensUnwrappedRepository: Repository<TokensUnwrappedEntity>,
    private subgraphClientService: SubgraphClientService,
  ) {}

  async onEventReceived(
    _event: EventBridgeEvent<any, any>,
  ): Promise<TokensUnwrappedEntity[]> {
    const tokensUnwrapped =
      await this.subgraphClientService.getTokensUnwrapped();

    console.log('Subgraph Tokens: ', tokensUnwrapped);

    const savedTokens =
      await this.tokensUnwrappedRepository.save(tokensUnwrapped);
    console.log('Saved Tokens: ', savedTokens);

    return tokensUnwrapped;
  }
}
