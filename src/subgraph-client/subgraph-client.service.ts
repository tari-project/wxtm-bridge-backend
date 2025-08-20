import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { gql, request } from 'graphql-request';
import { TokensUnwrappedRecordsResponse } from '../subgraph/types';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { IConfig } from '../config/config.interface';
import { ethers } from 'ethers';

@Injectable()
export class SubgraphClientService {
  private readonly subgraphUrl: string;

  constructor(private readonly configService: ConfigService<IConfig, true>) {
    this.subgraphUrl = this.configService.get('subgraph', { infer: true }).url;
  }

  async getTokensUnwrappedRecords(
    lastRecord: number,
  ): Promise<Partial<TokensUnwrappedEntity>[]> {
    const query = gql`
      {
        tokensUnwrappedRecords(
          where: { nonce_gt: ${lastRecord}, signature: "TokensUnwrapped" }
          orderBy: nonce
          first: 1000
        ) {
          id
          nonce
          signature
          contract
          timestamp
          blockHash
          blockNumber
          transactionHash
          logIndex
          transactionData
        }
      }
    `;

    const data = await request<TokensUnwrappedRecordsResponse>(
      this.subgraphUrl,
      query,
    );

    const coder = new ethers.utils.AbiCoder();

    return data.tokensUnwrappedRecords.map((event) => {
      const decodedData = coder.decode(
        ['(tuple(address,string),uint256)'],
        event.transactionData,
      );

      const from = decodedData[0][0][0];
      const tariAddress = decodedData[0][0][1];
      const amount = decodedData[0][1];

      return {
        subgraphId: event.id,
        nonce: parseInt(event.nonce),
        from: from,
        targetTariAddress: tariAddress,
        amount: amount.toString(),
        blockNumber: parseInt(event.blockNumber),
        blockTimestamp: new Date(parseInt(event.timestamp) * 1000),
        transactionHash: event.transactionHash,
      };
    });
  }
}
