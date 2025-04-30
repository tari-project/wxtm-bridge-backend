import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { gql, request } from 'graphql-request';
import {
  TokensUnwrappedsResponse,
  PushNotificationsResponse,
} from '../subgraph/types';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { IConfig } from '../config/config.interface';
import { ethers } from 'ethers';

@Injectable()
export class SubgraphClientService {
  private readonly subgraphUrl: string;

  constructor(private readonly configService: ConfigService<IConfig, true>) {
    this.subgraphUrl = this.configService.get('subgraph', { infer: true }).url;
  }

  async getPushNotifications(
    lastRecord: number,
  ): Promise<Partial<TokensUnwrappedEntity>[]> {
    const query = gql`
      {
        pushNotifications(
          where: { seqNumber_gt: ${lastRecord}, signature: "TokensUnwrapped" }
          orderBy: seqNumber
          first: 1000
        ) {
          id
          signature
          contract
          timestamp
          blockHash
          blockNumber
          transactionHash
          logIndex
          seqNumber
          transactionData
        }
      }
    `;

    const data = await request<PushNotificationsResponse>(
      this.subgraphUrl,
      query,
    );

    const coder = new ethers.utils.AbiCoder();

    return data.pushNotifications.map((event) => {
      const decodedData = coder.decode(
        ['(tuple(address,string),uint256)'],
        event.transactionData,
      );

      const from = decodedData[0][0][0];
      const tariAddress = decodedData[0][0][1];
      const amount = decodedData[0][1];

      return {
        subgraphId: parseInt(event.seqNumber),
        from: from,
        targetTariAddress: tariAddress,
        amount: amount.toString(),
        blockNumber: parseInt(event.blockNumber),
        blockTimestamp: new Date(parseInt(event.timestamp) * 1000),
        transactionHash: event.transactionHash,
      };
    });
  }

  /** @dev Consider removal of below fn */
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
