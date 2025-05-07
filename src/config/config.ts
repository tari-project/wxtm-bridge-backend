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
  subgraph: {
    url: process.env.SUBGRAPH_URL || '',
  },
  fees: {
    wrapTokenFeePercentageBps: 0.25 * 100, // 0.25% in basis points
  },
});
