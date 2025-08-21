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
  ): Promise<Partial<TokensUnwrappedEntity>[]> {
    const lastRecord = await this.tokensUnwrappedRepository.find({
      order: { nonce: 'DESC' },
      take: 1,
    });

    const lastNonce: number = lastRecord[0]?.nonce ?? -1;

    /** @TODO Remove console.logs after testing */
    console.log('Processing nonce: ', lastNonce);

    const tokensUnwrapped =
      await this.subgraphClientService.getTokensUnwrappedRecords(lastNonce);

    console.log('Saving new events: ', tokensUnwrapped);

    const savedTokens =
      await this.tokensUnwrappedRepository.save(tokensUnwrapped);
    console.log('Saved events: ', savedTokens);

    return tokensUnwrapped;
  }
}
