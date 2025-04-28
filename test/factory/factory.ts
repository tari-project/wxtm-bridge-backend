import factory from 'factory-girl';

import { testDataSource } from '../database';
import { CustomTypeORMAdapter } from './typeorm.adapter';
import { UserEntity } from '../../src/user/user.entity';
import { WrapTokenTransactionEntity } from '../../src/wrap-token-transaction/wrap-token-transaction.entity';
import { TokensUnwrappedEntity } from '../../src/tokens-unwrapped/tokens-unwrapped.entity';

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

    factory.define(TokensUnwrappedEntity.name, TokensUnwrappedEntity, {
      from: factory.sequence('TokensUnwrappedEntity.from', (n) => `0x${n}`),
      targetTariAddress: factory.sequence(
        'TokensUnwrappedEntity.targetTariAddress',
        (n) => `tari${n}`,
      ),
      amount: factory.sequence(
        'TokensUnwrappedEntity.amount',
        (n) => `${n}000000000000000000`,
      ),
      blockNumber: factory.sequence(
        'TokensUnwrappedEntity.blockNumber',
        (n) => n + 1000000,
      ),
      blockTimestamp: factory.sequence(
        'TokensUnwrappedEntity.blockTimestamp',
        (_n) => new Date(),
      ),
      transactionHash: factory.sequence(
        'TokensUnwrappedEntity.transactionHash',
        (n) => `0xhash${n}`,
      ),
    });

    factoryCached = factory;
  }

  return factoryCached;
};
