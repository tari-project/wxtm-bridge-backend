import { Injectable } from '@nestjs/common';
import { gql, request } from 'graphql-request';
import { TokensUnwrappedsResponse } from './types';

const SUBGRAPH_URL =
  process.env.SUBGRAPH_URL ||
  'https://api.studio.thegraph.com/query/109825/wxtm-bridge/version/latest';

@Injectable()
export class SubgraphClientService {
  async getTokensUnwrapped(): Promise<any[]> {
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
    const data = await request<TokensUnwrappedsResponse>(SUBGRAPH_URL, query);
    return data.tokensUnwrappeds;
  }
}
