import { DataSourceOptions } from 'typeorm';

export enum Enviroment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
  STAGING = 'staging',
}

export interface IConfig {
  enviroment: 'development' | 'production' | 'test' | 'staging';
  database: DataSourceOptions;
  testDatabase: DataSourceOptions;
}
