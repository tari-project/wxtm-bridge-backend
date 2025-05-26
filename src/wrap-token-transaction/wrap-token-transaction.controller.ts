import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@dataui/crud';

import { AdminGuard } from '../auth/auth.admin.guard';
import { WrapTokenTransactionService } from './wrap-token-transaction.service';
import { WrapTokenTransactionEntity } from './wrap-token-transaction.entity';

@Crud({
  model: { type: WrapTokenTransactionEntity },
  routes: {
    only: ['updateOneBase', 'getManyBase', 'getOneBase'],
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
}
