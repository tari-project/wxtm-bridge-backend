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

    console.log('domain_qqq', domain);

    const client = new JwksClient({
      jwksUri: `https://${domain}/.well-known/jwks.json`,
      cache: true,
    });

    console.log('client_qqq', client);

    const keys = await client.getSigningKeys();

    console.log('keys_qqq', keys);
    const publicKey = keys[0].getPublicKey();

    console.log('publicKey_qqq', publicKey);

    return { publicKey };
  },
  inject: [ConfigService],
};
