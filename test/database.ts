import { DataSource, ObjectLiteral } from 'typeorm';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import config from '../src/config/config';
import { IConfig } from '../src/config/config.interface';

const options = config().testDatabase;
export const testDataSource = new DataSource(options);

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService<IConfig, true>) => {
        return config.get('testDatabase');
      },
      inject: [ConfigService],
    }),
  ],
})
export class TestDatabaseModule {}

export const clearDatabase = async () => {
  await testDataSource.manager.transaction(async (tm) => {
    for (const entity of testDataSource.entityMetadatas) {
      if (entity.tableType !== 'regular') continue;

      await tm.query(`ALTER TABLE "${entity.tableName}" DISABLE TRIGGER ALL;`);
      await tm
        .createQueryBuilder()
        .delete()
        .from(entity.target)
        .where('1 = 1')
        .execute();

      await tm.query(`ALTER TABLE "${entity.tableName}" ENABLE TRIGGER ALL;`);
    }
  });
};

export const initializeDatabase = async () => {
  if (!testDataSource.isInitialized) {
    await testDataSource.initialize();
  }
};

export const getRepository = <T extends ObjectLiteral>(
  ...args: Parameters<typeof testDataSource.getRepository<T>>
) => testDataSource.getRepository<T>(...args);
