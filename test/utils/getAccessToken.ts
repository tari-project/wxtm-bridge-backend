import { privateKeyStr } from '../mocks/keys.mock';
import { generateToken } from './generateToken';

export const getAccessToken = (sub?: string): string => {
  return generateToken(privateKeyStr, sub);
};
