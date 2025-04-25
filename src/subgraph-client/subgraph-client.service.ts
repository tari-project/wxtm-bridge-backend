import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { gql, request } from 'graphql-request';
import { TokensUnwrappedsResponse } from '../subgraph/types';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { IConfig } from '../config/config.interface';

@Injectable()
export class SubgraphClientService {
  private readonly subgraphUrl: string;

  constructor(private readonly configService: ConfigService<IConfig, true>) {
    this.subgraphUrl = this.configService.get('subgraph', { infer: true }).url;
  }

  async getTokensUnwrapped(): Promise<TokensUnwrappedEntity[]> {
    const query = gql`
      {
        tokensUnwrappeds(
          first: 5
          orderBy: blockTimestamp
          orderDirection: desc
        ) {
          id
          from
          targetTariAddress
          amount
          blockNumber
          blockTimestamp
          transactionHash
        }
      }
    `;

    try {
      const data = await request<TokensUnwrappedsResponse>(
        this.subgraphUrl,
        query,
      );

      return data.tokensUnwrappeds.map((token) => {
        const entity = new TokensUnwrappedEntity();
        entity.id = parseInt(token.id);
        entity.from = token.from;
        entity.targetTariAddress = token.targetTariAddress;
        entity.amount = token.amount;
        entity.blockNumber = parseInt(token.blockNumber);
        entity.blockTimestamp = new Date(parseInt(token.blockTimestamp) * 1000);
        entity.transactionHash = token.transactionHash;
        return entity;
      });
    } catch (error) {
      console.error(
        'Failed to fetch tokens unwrapped event from subgraph:',
        error,
      );
      throw error;
    }
  }
}
