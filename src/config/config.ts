import { entities } from './config.entities';
import { IConfig } from './config.interface';
import { Enviroment } from './config.interface';

export default (): IConfig => ({
  domain: process.env.DOMAIN || '',
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
    token: process.env.M2M_AUTH_TOKEN || '',
  },
  subgraph: {
    url: process.env.SUBGRAPH_URL || '',
  },
  fees: {
    wrapTokenFeePercentageBps: 0.5 * 100, // 0.5% in basis points
  },
  blockchain: {
    chainId: BigInt(process.env.CHAIN_ID || 1),
  },
  coldWalletAddress: process.env.COLD_WALLET_ADDRESS || '',
  transactionTimeout: Number(
    process.env.TRANSACTION_TIMEOUT || 1 * 60 * 60 * 1000,
  ),
  aws: {
    region: process.env.AWS_REGION || '',
    notificationsTopicArn: process.env.NOTIFICATIONS_TOPIC_ARN || '',
  },
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
  },
});
