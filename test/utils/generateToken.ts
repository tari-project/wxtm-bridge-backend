import { v4 as uuidv4 } from 'uuid';
import { sign } from 'jsonwebtoken';

import { Auth0Payload } from '../../src/auth/auth.types';
import config from '../../src/config/config';

const auth0 = config().auth0;

export const generateToken = (privateKey: string, sub?: string): string => {
  const payload: Auth0Payload = {
    aud: [auth0.audience],
    sub: sub ? sub : uuidv4(),
    iss: `https://${auth0.domain}/`,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour from now
    scope: 'openid profile email',
    azp: 'your-client-id',
  };

  const accessToken = sign(payload, privateKey, {
    algorithm: 'RS256',
  });

  return accessToken;
};
