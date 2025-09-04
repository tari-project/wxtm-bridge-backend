import { Body, Controller, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@dataui/crud';

import { M2MAuthGuard } from '../m2m-auth/m2m-auth.guard';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { TokensUnwrappedM2MService } from './tokens-unwrapped-m2m.service';
import { SuccessDTO } from '../dto/success.dto';
import {
  TokensUnwrappedSetErrorDTO,
  UpdateSendingTokensDTO,
  UpdateTokensUnwrappedStatusDTO,
  UpdateToTokensSentDTO,
} from './tokens-unwrapped-m2m.dto';

@Crud({
  model: { type: TokensUnwrappedEntity },
  routes: {
    only: ['getManyBase', 'getOneBase'],
    getManyBase: {
      decorators: [
        M2MAuthGuard({
          description: 'This endpoint is protected by M2M authentication',
        }),
      ],
    },
    getOneBase: {
      decorators: [
        M2MAuthGuard({
          description: 'This endpoint is protected by M2M authentication',
        }),
      ],
    },
  },
})
@ApiTags('tokens-unwrapped-m2m')
@ApiBearerAuth()
@Controller('tokens-unwrapped-m2m')
export class TokensUnwrappedM2MController
  implements CrudController<TokensUnwrappedEntity>
{
  constructor(public service: TokensUnwrappedM2MService) {}

  @Patch('awaiting-confirmation')
  @M2MAuthGuard({
    description: 'Update transaction to awaiting confirmation',
  })
  updateToAwaitingConfirmation(
    @Body() { paymentId }: UpdateTokensUnwrappedStatusDTO,
  ): Promise<SuccessDTO> {
    return this.service.updateToAwaitingConfirmation(paymentId);
  }

  @Patch('confirmed')
  @M2MAuthGuard({
    description: 'Update transaction to confirmed',
  })
  updateToConfirmed(
    @Body() { paymentId }: UpdateTokensUnwrappedStatusDTO,
  ): Promise<SuccessDTO> {
    return this.service.updateToConfirmed(paymentId);
  }

  @Patch('init-send-tokens')
  @M2MAuthGuard({
    description: 'Update transaction to init send tokens',
  })
  updateToInitSendTokens(
    @Body() { paymentId }: UpdateTokensUnwrappedStatusDTO,
  ): Promise<SuccessDTO> {
    return this.service.updateToInitSendTokens(paymentId);
  }

  @Patch('sending-tokens')
  @M2MAuthGuard({
    description: 'Update transaction to sending tokens',
  })
  updateToSendingTokens(
    @Body() dto: UpdateSendingTokensDTO,
  ): Promise<SuccessDTO> {
    return this.service.updateToSendingTokens(dto);
  }

  @Patch('tokens-sent')
  @M2MAuthGuard({
    description: 'Update transaction to tokens sent',
  })
  updateToTokensSent(@Body() dto: UpdateToTokensSentDTO): Promise<SuccessDTO> {
    return this.service.updateToTokensSent(dto);
  }

  @Patch('set-error')
  @M2MAuthGuard({
    description: 'Set error on unwrapped tokens transaction',
  })
  setCurrentError(
    @Body() dto: TokensUnwrappedSetErrorDTO,
  ): Promise<SuccessDTO> {
    return this.service.setCurrentError(dto);
  }
}
