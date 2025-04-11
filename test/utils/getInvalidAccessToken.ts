import { foreingPrivateKeyStr } from '../mocks/keys.mock';
import { generateToken } from './generateToken';

export const getInvalidAccessToken = (sub?: string): string => {
  return generateToken(foreingPrivateKeyStr, sub);
};
