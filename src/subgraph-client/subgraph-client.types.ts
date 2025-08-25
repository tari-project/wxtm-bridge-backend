export type TokensUnwrappedRecord = {
  id: string;
  nonce: string;
  signature: string;
  contract: string;
  timestamp: string;
  blockHash: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: string;
  transactionData: string;
};

export type TokensUnwrappedRecordsResponse = {
  tokensUnwrappedRecords: TokensUnwrappedRecord[];
};

export type TokensUnwrappedDecoded = {
  subgraphId: string;
  nonce: number;
  signature: string;
  contractAddress: string;
  from: string;
  targetTariAddress: string;
  amount: string;
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  blockTimestamp: Date;
};
