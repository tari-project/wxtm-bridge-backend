import { Controller, Patch, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Crud, CrudController } from '@dataui/crud';

import { AdminGuard } from '../auth/auth.admin.guard';
import { WrapTokenTransactionService } from './wrap-token-transaction.service';
import { WrapTokenTransactionEntity } from './wrap-token-transaction.entity';
import {
  CreateWrapTokenTransactionDTO,
  UpdateWrapTokenTransactionDTO,
} from './wrap-token-transaction.dto';
import { SuccessDTO } from '../dto/success.dto';

@Crud({
  model: { type: WrapTokenTransactionEntity },
  dto: {
    create: CreateWrapTokenTransactionDTO,
    update: UpdateWrapTokenTransactionDTO,
  },
  routes: {
    only: ['updateOneBase', 'getManyBase', 'getOneBase', 'createOneBase'],
    getManyBase: {
      decorators: [
        AdminGuard({ description: 'Returns wrap token transactions' }),
      ],
    },
    getOneBase: {
      decorators: [
        AdminGuard({ description: 'Returns wrap token transaction' }),
      ],
    },
    updateOneBase: {
      decorators: [
        AdminGuard({ description: 'Updates wrap token transaction' }),
      ],
    },
  },
})
@ApiTags('wrap-token-transactions')
@ApiBearerAuth()
@Controller('wrap-token-transactions')
export class WrapTokenTransactionController
  implements CrudController<WrapTokenTransactionEntity>
{
  constructor(public service: WrapTokenTransactionService) {}

  @Patch('tokens-sent/:id')
  @ApiOperation({ summary: 'Update transaction status to tokens sent' })
  updateToTokensSent(@Param('id') id: string): Promise<SuccessDTO> {
    return this.service.updateToTokensSent(id);
  }
}
