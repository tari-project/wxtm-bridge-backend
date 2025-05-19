import { Body, Controller, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@dataui/crud';

import { WrapTokenTransactionM2MService } from './wrap-token-transaction-m2m.service';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import {
  TokensReceivedRequestDTO,
  ErrorUpdateRequestDTO,
  TransactionCreatedRequestDTO,
  CreatingTransactionRequestDTO,
} from './wrap-token-transaction-m2m.dto';
import { SuccessDTO } from '../dto/success.dto';
import { M2MAuthGuard } from '../m2m-auth/m2m-auth.guard';

@Crud({
  model: { type: WrapTokenTransactionEntity },
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
@ApiTags('wrap-token-transactions-m2m')
@ApiBearerAuth()
@Controller('wrap-token-transactions-m2m')
export class WrapTokenTransactionM2MController
  implements CrudController<WrapTokenTransactionEntity>
{
  constructor(public service: WrapTokenTransactionM2MService) {}

  @Patch('tokens-received')
  @M2MAuthGuard({
    description: 'Update tokens received status with M2M authentication',
  })
  updateToTokensReceived(
    @Body() dto: TokensReceivedRequestDTO,
  ): Promise<SuccessDTO> {
    return this.service.updateToTokensReceived(dto);
  }

  @Patch('creating-transaction')
  @M2MAuthGuard({
    description: 'Update to creating transaction status',
  })
  updateToCreatingTransaction(
    @Body() dto: CreatingTransactionRequestDTO,
  ): Promise<SuccessDTO> {
    return this.service.updateToCreatingTransaction(dto);
  }

  @Patch('transaction-created')
  @M2MAuthGuard({
    description: 'Update to transaction created status',
  })
  updateToTransactionCreated(
    @Body() dto: TransactionCreatedRequestDTO,
  ): Promise<SuccessDTO> {
    return this.service.updateToTransactionCreated(dto);
  }

  @Patch('set-error')
  @M2MAuthGuard({
    description: 'Set error status with M2M authentication',
  })
  setCurrentError(@Body() dto: ErrorUpdateRequestDTO): Promise<SuccessDTO> {
    return this.service.setCurrentError(dto);
  }
}
