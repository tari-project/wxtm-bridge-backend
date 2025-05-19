import { Injectable, Inject, applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { M2M_AUTH_STRATEGY, M2M_AUTH_TOKEN } from './m2m-auth.const';
import { M2MAuthOptions } from './m2m-auth.interface';
import { Request } from 'express';

@Injectable()
export class M2MAuthStrategy extends PassportStrategy(
  Strategy,
  M2M_AUTH_STRATEGY,
) {
  constructor(@Inject(M2M_AUTH_TOKEN) private readonly authToken: string) {
    super();
  }

  async validate(request: Request): Promise<boolean> {
    const authHeader = request.headers.authorization;
    const stateMachineAuth = request.headers['state-machine-auth'] as string;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      if (token && token === this.authToken) {
        return true;
      }
    }

    if (stateMachineAuth && stateMachineAuth === this.authToken) {
      return true;
    }

    return false;
  }
}

class Guard extends AuthGuard(M2M_AUTH_STRATEGY) {}

export function M2MAuthGuard({ description }: M2MAuthOptions) {
  return applyDecorators(
    UseGuards(Guard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiOperation({
      summary: description,
    }),
  );
}
