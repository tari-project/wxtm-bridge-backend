import { UserEntity } from '../user/user.entity';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { WrapTokenAuditEntity } from '../wrap-token-audit/wrap-token-audit.entity';
import { SettingsEntity } from '../settings/settings.entity';

export const entities = [
  UserEntity,
  WrapTokenTransactionEntity,
  TokensUnwrappedEntity,
  WrapTokenAuditEntity,
  SettingsEntity,
];
