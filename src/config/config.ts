import { IConfig } from './config.interface';
import { Enviroment } from './config.interface';

export default (): IConfig => ({
  enviroment: (process.env.NODE_ENV as Enviroment) || 'test',
  database: {
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/src/migrations/*.js'],
    synchronize: false,
  },
  testDatabase: {
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: 5432,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
    synchronize: true,
  },
});
