import { JwksClient } from 'jwks-rsa';

import { ConfigService } from '@nestjs/config';
import { IConfig } from '../config/config.interface';

export class Auth0Keys {
  publicKey: string;
}

export const Auth0KeysProvider = {
  provide: Auth0Keys,
  useFactory: async (configService: ConfigService<IConfig, true>) => {
    const domain = configService.get('auth0.domain', {
      infer: true,
    });

    const client = new JwksClient({
      jwksUri: `https://${domain}/.well-known/jwks.json`,
      cache: true,
    });

    const keys = await client.getSigningKeys();

    const publicKey = keys[0].getPublicKey();

    return { publicKey };
  },
  inject: [ConfigService],
};
