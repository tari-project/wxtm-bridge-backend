import { SafeMultisigTransactionListResponse } from '@safe-global/api-kit';

export type SafeMultisigTransactionResponse =
  SafeMultisigTransactionListResponse['results'][0];

export type GetMultisignTransactionParams = {
  safeTxHash: string;
};
