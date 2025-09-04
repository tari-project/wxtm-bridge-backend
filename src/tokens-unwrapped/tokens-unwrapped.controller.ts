import { Controller, Param, Patch, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Crud, CrudController } from '@dataui/crud';

import { AdminGuard } from '../auth/auth.admin.guard';
import { TokensUnwrappedEntity } from './tokens-unwrapped.entity';
import { TokensUnwrappedService } from './tokens-unwrapped.service';
import { SuccessDTO } from '../dto/success.dto';
import { UserId } from '../decorators/user-id.decorator';
import { GetUserUnwrappedTransactionsRespDTO } from './tokens-unwrapped.dto';

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

  @Get('transactions')
  @ApiOperation({
    summary: 'Get all unwrapped transactions by target Tari address',
  })
  getUserTransactions(
    @Query('tariAddress') tariAddress: string,
  ): Promise<GetUserUnwrappedTransactionsRespDTO> {
    return this.service.getUserTransactions(tariAddress);
  }

  @Patch('approve/:id')
  @AdminGuard({
    description: 'Approve unwrapped tokens transaction',
  })
  approveTransaction(
    @Param('id') id: string,
    @UserId() userId: number,
  ): Promise<SuccessDTO> {
    return this.service.approveTransaction(Number(id), userId);
  }
}
