export type OwnershipTransferred = {
  id: string;
  previousOwner: string;
  newOwner: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
};

export type OwnershipTransfersResponse = {
  ownershipTransferreds: OwnershipTransferred[];
};

export type TokensUnwrapped = {
  id: string;
  from: string;
  targetTariAddress: string;
  amount: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
};

export type TokensUnwrappedsResponse = {
  tokensUnwrappeds: TokensUnwrapped[];
};

export type PushNotification = {
  id: string;
  signature: string;
  contract: string;
  timestamp: string;
  blockHash: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: string;
  seqNumber: string;
  transactionData: string;
};

export type PushNotificationsResponse = {
  pushNotifications: PushNotification[];
};
