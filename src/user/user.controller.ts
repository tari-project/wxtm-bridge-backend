import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@dataui/crud';

import { UserService } from './user.service';
import { UserEntity } from './user.entity';

@Crud({
  model: { type: UserEntity },
  routes: {
    only: ['getOneBase', 'getManyBase'],
  },
})
@ApiTags('user')
@Controller('user')
export class UserController implements CrudController<UserEntity> {
  constructor(public service: UserService) {}
}
