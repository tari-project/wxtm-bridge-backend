import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { UserEntity } from '../user/user.entity';

export const UserId = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user: UserEntity }>();

  return request.user.id;
});
