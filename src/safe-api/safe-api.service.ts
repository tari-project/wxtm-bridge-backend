import { Injectable } from '@nestjs/common';
import SafeApiKit from '@safe-global/api-kit';

import {
  GetMultisignTransactionParams,
  SafeMultisigTransactionResponse,
} from './safe-api.types';

@Injectable()
export class SafeApiService {
  constructor(private safeApiKit: SafeApiKit) {}

  async getMultisignTransaction({
    safeTxHash,
  }: GetMultisignTransactionParams): Promise<SafeMultisigTransactionResponse> {
    return this.safeApiKit.getTransaction(safeTxHash);
  }
}
