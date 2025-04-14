import { applyDecorators, Injectable, UseGuards } from '@nestjs/common';
import { PassportStrategy, AuthGuard } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Auth0Payload } from './auth.types';
import { Auth0Keys } from './auth.providers';
import { AuthService } from './auth.service';
import { IConfig } from '../config/config.interface';

const AdminAuth0JwtStrategy = 'AdminAuth0JwtStrategy';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(
  Strategy,
  AdminAuth0JwtStrategy,
) {
  constructor(
    protected readonly auth0Keys: Auth0Keys,
    protected readonly configService: ConfigService<IConfig, true>,
    private readonly authService: AuthService,
  ) {
    const { domain, audience } = configService.get('auth0', {
      infer: true,
    });

    console.log('domain_xxx', domain);
    console.log('audience_xxx', audience);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: auth0Keys.publicKey,
      issuer: `https://${domain}/`,
      audience,
      algorithms: ['RS256'],
    });
  }
  async validate(payload: Auth0Payload) {
    const user = await this.authService.findOrCreateUser(payload.sub);

    if (!user.isAdmin) {
      return null;
    }
    return user;
  }
}

class Guard extends AuthGuard(AdminAuth0JwtStrategy) {}

export function AdminGuard({ description }: { description: string }) {
  return applyDecorators(
    UseGuards(Guard),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiOperation({
      summary: description,
    }),
  );
}
