import { PickType } from '@nestjs/swagger';

import { UserEntity } from './user.entity';

export class GetMeRespDTO extends PickType(UserEntity, ['isAdmin']) {}
