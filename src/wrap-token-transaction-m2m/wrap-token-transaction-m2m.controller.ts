import { Body, Controller, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@dataui/crud';

import { WrapTokenTransactionM2MService } from './wrap-token-transaction-m2m.service';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import {
  TokensReceivedRequestDTO,
  TransactionProposedRequestDTO,
} from './wrap-token-transaction-m2m.dto';
import { SuccessDTO } from '../dto/success.dto';

@Crud({
  model: { type: WrapTokenTransactionEntity },
  routes: {
    only: ['getManyBase', 'getOneBase'],
    getManyBase: {
      decorators: [
        //TODO Add m2m guard
      ],
    },
    getOneBase: {
      decorators: [
        //TODO Add m2m guard
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
  updateToTokensReceived(
    @Body() dto: TokensReceivedRequestDTO,
  ): Promise<SuccessDTO> {
    return this.service.updateToTokensReceived(dto);
  }

  @Patch('transaction-proposed')
  updateToTransactionProposed(
    @Body() dto: TransactionProposedRequestDTO,
  ): Promise<SuccessDTO> {
    return this.service.updateToTransactionProposed(dto);
  }
}
