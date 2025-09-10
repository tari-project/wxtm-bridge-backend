import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventBridgeEvent } from 'aws-lambda';
import { SubgraphClientService } from '../subgraph-client/subgraph-client.service';
import { TokenFeesService } from '../token-fees/token-fees.service';
import { TokensUnwrappedAuditService } from '../tokens-unwrapped-audit/tokens-unwrapped-audit.service';

import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { TokensUnwrappedStatus } from '../tokens-unwrapped/tokens-unwrapped.const';

@Injectable()
export class SubgraphService {
  constructor(
    @InjectRepository(TokensUnwrappedEntity)
    private tokensUnwrappedRepository: Repository<TokensUnwrappedEntity>,
    private subgraphClientService: SubgraphClientService,
    private readonly tokenFeesService: TokenFeesService,
    private readonly tokensUnwrappedAuditService: TokensUnwrappedAuditService,
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
      const { feeAmount, amountAfterFee, feePercentageBps } =
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

    for (const token of savedTokens) {
      await this.tokensUnwrappedAuditService.recordTransactionEvent({
        transactionId: token.id,
        paymentId: token.paymentId,
        toStatus: TokensUnwrappedStatus.CREATED,
      });
    }

    return savedTokens;
  }
}
