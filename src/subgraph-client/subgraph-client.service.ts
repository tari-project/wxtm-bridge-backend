import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { gql, request } from 'graphql-request';
import { PushNotificationsResponse } from '../subgraph/types';
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
        ['(tuple(address,string),uint256,uint256)'],
        event.transactionData,
      );

      const from = decodedData[0][0][0];
      const tariAddress = decodedData[0][0][1];
      const amount = decodedData[0][1];
      const nonce = decodedData[0][2];

      return {
        subgraphId: parseInt(event.seqNumber),
        from: from,
        targetTariAddress: tariAddress,
        amount: amount.toString(),
        nonce: nonce.toString(),
        blockNumber: parseInt(event.blockNumber),
        blockTimestamp: new Date(parseInt(event.timestamp) * 1000),
        transactionHash: event.transactionHash,
      };
    });
  }
}
