import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { M2M_AUTH_STRATEGY } from '../m2m-auth/m2m-auth.const';

const AdminAuth0JwtStrategy = 'AdminAuth0JwtStrategy';

class AdminOrM2MGuard extends AuthGuard([
  AdminAuth0JwtStrategy,
  M2M_AUTH_STRATEGY,
]) {}

export function AdminOrM2MAuthGuard({ description }: { description: string }) {
  return applyDecorators(
    UseGuards(AdminOrM2MGuard),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiOperation({
      summary: description,
    }),
  );
}
