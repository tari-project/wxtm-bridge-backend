import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@dataui/crud';

import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import { AdminGuard } from '../auth/auth.admin.guard';

@Crud({
  model: { type: UserEntity },
  routes: {
    only: ['getManyBase'],
    getManyBase: {
      decorators: [AdminGuard({ description: 'Get users' })],
    },
  },
})
@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController implements CrudController<UserEntity> {
  constructor(public service: UserService) {}
}
