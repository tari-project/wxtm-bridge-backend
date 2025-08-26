import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { gql, request } from 'graphql-request';
import { TokensUnwrappedDecoded } from './subgraph-client.types';
import { TokensUnwrappedRecordsResponse } from './subgraph-client.types';
import { ethers } from 'ethers';

import { IConfig } from '../config/config.interface';

@Injectable()
export class SubgraphClientService {
  private readonly subgraphUrl: string;

  constructor(private readonly configService: ConfigService<IConfig, true>) {
    this.subgraphUrl = this.configService.get('subgraph', { infer: true }).url;
  }

  async getTokensUnwrappedRecords(
    lastRecord: number,
  ): Promise<TokensUnwrappedDecoded[]> {
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

      const from: string = decodedData[0][0][0];
      const tariAddress: string = decodedData[0][0][1];
      const amount: string = decodedData[0][1];

      return {
        subgraphId: event.id,
        nonce: parseInt(event.nonce),
        signature: event.signature,
        contractAddress: event.contract,
        from: from,
        targetTariAddress: tariAddress,
        amount: amount.toString(),
        transactionHash: event.transactionHash,
        blockHash: event.blockHash,
        blockNumber: parseInt(event.blockNumber),
        blockTimestamp: new Date(parseInt(event.timestamp) * 1000),
      };
    });
  }
}
