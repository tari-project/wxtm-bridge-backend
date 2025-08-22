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
