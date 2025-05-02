import { IsEnum, IsOptional } from 'class-validator';

import { TokensUnwrappedEntity } from './tokens-unwrapped.entity';
import { TokensUnwrappedStatus } from './tokens-unwrapped.const';

export class UpdateTokensUnwrappedDTO
  implements Partial<TokensUnwrappedEntity>
{
  @IsOptional()
  @IsEnum(TokensUnwrappedStatus)
  status?: TokensUnwrappedStatus;
}
