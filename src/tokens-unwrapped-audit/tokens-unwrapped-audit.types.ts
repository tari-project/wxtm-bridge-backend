import { PickType } from '@nestjs/swagger';

import { TokensUnwrappedAuditEntity } from './tokens-unwrapped-audit.entity';

export class RecordTransactionEventParams extends PickType(
  TokensUnwrappedAuditEntity,
  ['fromStatus', 'toStatus', 'paymentId', 'note'],
) {
  transactionId: number;
}
