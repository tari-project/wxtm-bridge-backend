export type TokensUnwrappedDecoded = {
  subgraphId: string;
  nonce: number;
  signature: string;
  contract: string;
  from: string;
  targetTariAddress: string;
  amount: string;
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  blockTimestamp: Date;
};
