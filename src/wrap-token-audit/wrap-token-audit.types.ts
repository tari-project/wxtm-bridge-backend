import { PickType } from '@nestjs/swagger';

import { WrapTokenAuditEntity } from './wrap-token-audit.entity';

export class RecordTransactionEventParams extends PickType(
  WrapTokenAuditEntity,
  ['fromStatus', 'toStatus', 'paymentId', 'note'],
) {
  transactionId: number;
}
