import { UserEntity } from '../user/user.entity';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { TokensUnwrappedEntity } from '../subgraph/tokens-unwrapped.entity';

export const entities = [
  UserEntity,
  WrapTokenTransactionEntity,
  TokensUnwrappedEntity,
];
