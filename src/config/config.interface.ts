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

export interface IM2MAuth {
  token: string;
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

export interface IAWS {
  region: string;
  notificationsTopicArn: string;
}

export interface ISlack {
  webhookUrl: string;
  tags: string[];
}

export interface IMineToExchange {
  walletAddress: string;
  addressPrefix: string;
  minTokenAmount: string;
}

export interface IConfig {
  domain: string;
  enviroment: Enviroment;
  database: DataSourceOptions;
  testDatabase: DataSourceOptions;
  auth0: IAuth0;
  m2mAuth: IM2MAuth;
  subgraph: ISubgraph;
  fees: IFees;
  blockchain: IBlockchain;
  coldWalletAddress: string;
  transactionTimeout: number;
  aws: IAWS;
  slack: ISlack;
  sentryDsn: string;
  mineToExchange: IMineToExchange;
}
