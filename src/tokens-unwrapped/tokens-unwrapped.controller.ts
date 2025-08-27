import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@dataui/crud';

import { AdminGuard } from '../auth/auth.admin.guard';
import { TokensUnwrappedEntity } from './tokens-unwrapped.entity';
import { TokensUnwrappedService } from './tokens-unwrapped.service';

@Crud({
  model: { type: TokensUnwrappedEntity },
  query: {
    join: {
      audits: {
        eager: true,
      },
    },
  },
  routes: {
    only: ['getManyBase', 'getOneBase'],
    getManyBase: {
      decorators: [
        AdminGuard({ description: 'Returns unwrapped tokens transactions' }),
      ],
    },
    getOneBase: {
      decorators: [
        AdminGuard({ description: 'Returns unwrapped tokens transaction' }),
      ],
    },
  },
})
@ApiTags('tokens-unwrapped')
@ApiBearerAuth()
@Controller('tokens-unwrapped')
export class TokensUnwrappedController
  implements CrudController<TokensUnwrappedEntity>
{
  constructor(public service: TokensUnwrappedService) {}
}
