import { DataSourceOptions } from 'typeorm';

export enum Enviroment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
  LOCAL = 'local',
}

export interface IAuth0 {
  domain: string;
  audience: string;
}

export interface ISubgraph {
  url: string;
}

export interface IFees {
  wrapTokenFeePercentageBps: number;
}

export interface IBlockchain {
  chainId: bigint;
}

export interface IConfig {
  enviroment: Enviroment;
  database: DataSourceOptions;
  testDatabase: DataSourceOptions;
  auth0: IAuth0;
  subgraph: ISubgraph;
  fees: IFees;
  blockchain: IBlockchain;
}
