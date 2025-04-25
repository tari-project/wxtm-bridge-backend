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

  async getTokensUnwrapped(): Promise<Partial<TokensUnwrappedEntity>[]> {
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

    const data = await request<TokensUnwrappedsResponse>(
      this.subgraphUrl,
      query,
    );

    return data.tokensUnwrappeds.map((token) => ({
      subgraphId: parseInt(token.id),
      from: token.from,
      targetTariAddress: token.targetTariAddress,
      amount: token.amount,
      blockNumber: parseInt(token.blockNumber),
      blockTimestamp: new Date(parseInt(token.blockTimestamp) * 1000),
      transactionHash: token.transactionHash,
    }));
  }
}
