import { TokensUnwrappedStatus } from '../tokens-unwrapped/tokens-unwrapped.const';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';

export interface SetTransactionToUnprocessableParams {
  transaction: TokensUnwrappedEntity;
  unprocessableStatus: TokensUnwrappedStatus;
  errorThreshold: number;
}
