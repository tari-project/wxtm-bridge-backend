import { entities } from './config.entities';
import { IConfig } from './config.interface';
import { Enviroment } from './config.interface';

export default (): IConfig => ({
  enviroment: (process.env.ENVIRONMENT as Enviroment) || Enviroment.LOCAL,
  database: {
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities,
    migrations: ['dist/migrations/*.js'],
    synchronize: false,
    ssl:
      (process.env.ENVIRONMENT as Enviroment) === Enviroment.LOCAL
        ? false
        : true,
  },
  testDatabase: {
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: 5432,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities,
    migrations: ['src/migrations/*.ts'],
    synchronize: true,
  },
  auth0: {
    domain: process.env.AUTH0_DOMAIN || '',
    audience: process.env.AUTH0_AUDIENCE || '',
  },
  m2mAuth: {
    token:
      'c971dd4c-c8e6-4513-838b-5ef487399167-f1b03db2-11f2-4b9b-9af8-938e889bac7e',
  },
  subgraph: {
    url: process.env.SUBGRAPH_URL || '',
  },
  fees: {
    wrapTokenFeePercentageBps: 0.3 * 100, // 0.3% in basis points
  },
  blockchain: {
    chainId: BigInt(process.env.CHAIN_ID || 1),
  },
  coldWalletAddress: process.env.COLD_WALLET_ADDRESS || '',
});
