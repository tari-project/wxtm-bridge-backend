import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UserService } from './user.service';
import { UserEntity } from './user.entity';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  getUsers(): Promise<UserEntity[]> {
    return this.service.getUsers();
  }
}
