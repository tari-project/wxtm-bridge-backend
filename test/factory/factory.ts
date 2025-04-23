import factory from 'factory-girl';

import { testDataSource } from '../database';
import { CustomTypeORMAdapter } from './typeorm.adapter';
import { UserEntity } from '../../src/user/user.entity';
import { WrapTokenTransactionEntity } from '../../src/wrap-token-transaction/wrap-token-transaction.entity';

export type Factory = typeof factory;
export let factoryCached: Factory | undefined;

export const getFactory = async (): Promise<Factory> => {
  if (!factoryCached) {
    factory.setAdapter(new CustomTypeORMAdapter(testDataSource));

    factory.define(UserEntity.name, UserEntity, {
      auth0Id: factory.sequence('UserEntity.auth0Id', (n) => `auth0Id-${n}`),
    });

    factory.define(
      WrapTokenTransactionEntity.name,
      WrapTokenTransactionEntity,
      {
        from: factory.sequence(
          'WrapTokenTransactionEntity.from',
          (n) => `from-${n}`,
        ),
        to: factory.sequence('WrapTokenTransactionEntity.to', (n) => `0x${n}`),
        tokenAmount: factory.sequence(
          'WrapTokenTransactionEntity.tokenAmount',
          (n) => `${n}`,
        ),
      },
    );

    factoryCached = factory;
  }

  return factoryCached;
};
