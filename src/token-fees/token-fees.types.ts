export type CalculateFeeParams = {
  tokenAmount: string;
};

export type CalculateFeeResponse = {
  feeAmount: string;
  amountAfterFee: string;
  feePercentageBps: number;
};
