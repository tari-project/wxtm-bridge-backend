import factory from 'factory-girl';

import { testDataSource } from '../database';
import { CustomTypeORMAdapter } from './typeorm.adapter';
import { UserEntity } from '../../src/user/user.entity';

export type Factory = typeof factory;
export let factoryCached: Factory | undefined;

export const getFactory = async (): Promise<Factory> => {
  if (!factoryCached) {
    factory.setAdapter(new CustomTypeORMAdapter(testDataSource));

    factory.define(UserEntity.name, UserEntity, {
      auth0Id: factory.sequence('UserEntity.auth0Id', (n) => `auth0Id-${n}`),
    });

    factoryCached = factory;
  }

  return factoryCached;
};
