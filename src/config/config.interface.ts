import { DataSourceOptions } from 'typeorm';

export enum Enviroment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
  LOCAL = 'local',
}

export interface IConfig {
  enviroment: Enviroment;
  database: DataSourceOptions;
  testDatabase: DataSourceOptions;
}
