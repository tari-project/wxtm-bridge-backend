import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventBridgeEvent } from 'aws-lambda';
import { SubgraphClientService } from '../subgraph-client/subgraph-client.service';
import { TokenFeesService } from '../token-fees/token-fees.service';

import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';

@Injectable()
export class SubgraphService {
  constructor(
    @InjectRepository(TokensUnwrappedEntity)
    private tokensUnwrappedRepository: Repository<TokensUnwrappedEntity>,
    private subgraphClientService: SubgraphClientService,
    private readonly tokenFeesService: TokenFeesService,
  ) {}

  async onEventReceived(
    _event: EventBridgeEvent<any, any>,
  ): Promise<TokensUnwrappedEntity[]> {
    const lastRecord = await this.tokensUnwrappedRepository.find({
      order: { nonce: 'DESC' },
      take: 1,
    });

    const lastNonce: number = lastRecord[0]?.nonce ?? -1;

    const tokensUnwrapped =
      await this.subgraphClientService.getTokensUnwrappedRecords(lastNonce);

    const tokensWithFees = tokensUnwrapped.map((token) => {
      const { amountAfterFee, feeAmount, feePercentageBps } =
        this.tokenFeesService.calculateUnwrapFee({
          tokenAmount: token.amount,
        });

      return {
        feePercentageBps,
        feeAmount,
        amountAfterFee,
        ...token,
      };
    });

    const savedTokens =
      await this.tokensUnwrappedRepository.save(tokensWithFees);

    return savedTokens;
  }
}
