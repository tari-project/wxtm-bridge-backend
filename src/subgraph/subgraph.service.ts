import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventBridgeEvent } from 'aws-lambda';
import { gql, request } from 'graphql-request';

import { UserEntity } from '../user/user.entity';
import { TokensUnwrappedEntity } from './tokens-unwrapped.entity';

import {
  OwnershipTransfersResponse,
  PushNotificationsResponse,
  TokensUnwrappedsResponse,
} from './types';

const SUBGRAPH_URL =
  process.env.SUBGRAPH_URL ||
  'https://api.studio.thegraph.com/query/109825/wxtm-bridge/version/latest';

@Injectable()
export class SubgraphService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(TokensUnwrappedEntity)
    private tokensUnwrappedRepository: Repository<TokensUnwrappedEntity>,
  ) {}

  async onEventReceived(
    event: EventBridgeEvent<any, any>,
  ): Promise<TokensUnwrappedEntity[]> {
    const tokensUnwrapped = await this.getTokensUnwrapped();

    console.log('Subgraph Tokens: ', tokensUnwrapped);

    const savedTokens =
      await this.tokensUnwrappedRepository.save(tokensUnwrapped);

    console.log('Saved Tokens: ', savedTokens);

    const dbTokens = await this.tokensUnwrappedRepository.find();

    console.log('DB Tokens: ', dbTokens);

    return tokensUnwrapped;
  }

  public async getTokensUnwrapped(): Promise<any[]> {
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
