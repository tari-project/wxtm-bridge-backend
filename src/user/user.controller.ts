import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@dataui/crud';

import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import { AdminGuard } from '../auth/auth.admin.guard';
import { UserGuard } from '../auth/auth.user.guard';
import { GetMeRespDTO } from './user.dto';
import { UserId } from '../decorators/user-id.decorator';

@Crud({
  model: { type: UserEntity },
  routes: {
    only: ['getManyBase', 'getOneBase'],
    getManyBase: {
      decorators: [AdminGuard({ description: 'Get users' })],
    },
    getOneBase: {
      decorators: [AdminGuard({ description: 'Get users' })],
    },
  },
})
@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController implements CrudController<UserEntity> {
  constructor(public service: UserService) {}

  @Get('me')
  @UserGuard({ description: 'Get current user info' })
  getMe(@UserId() userId: number): Promise<GetMeRespDTO> {
    return this.service.getMe(userId);
  }
}
