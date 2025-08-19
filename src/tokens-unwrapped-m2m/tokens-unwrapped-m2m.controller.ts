import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@dataui/crud';

import { M2MAuthGuard } from '../m2m-auth/m2m-auth.guard';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { TokensUnwrappedM2MService } from './tokens-unwrapped-m2m.service';

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
}
