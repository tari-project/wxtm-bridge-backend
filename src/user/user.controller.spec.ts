import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import config from '../config/config';
import {
  TestDatabaseModule,
  initializeDatabase,
  clearDatabase,
  getRepository,
} from '../../test/database';
import { UserModule } from './user.module';
import { UserEntity } from './user.entity';
import { setMiddlewares } from '../helpers/setMiddlewares';
import { Auth0Keys } from '../auth/auth.providers';
import { Auth0KeysMock } from '../../test/mocks/auth0-keys.mock';
import { getAccessToken } from '../../test/utils/getAccessToken';
import { Factory, getFactory } from '../../test/factory/factory';

describe('UserController', () => {
  let app: INestApplication;
  let factory: Factory;
  let adminAccessToken: string;
  let userAccessToken: string;
  let admin: UserEntity;
  let user: UserEntity;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [config], isGlobal: true }),
        TestDatabaseModule,
        UserModule,
      ],
    })
      .overrideProvider(Auth0Keys)
      .useValue(Auth0KeysMock)
      .compile();

    app = module.createNestApplication({ bodyParser: true });
    setMiddlewares(app);
    await app.init();

    await initializeDatabase();
    factory = await getFactory();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await clearDatabase();

    admin = await factory.create<UserEntity>(UserEntity.name, {
      isAdmin: true,
    });
    adminAccessToken = getAccessToken(admin.auth0Id);

    user = await factory.create<UserEntity>(UserEntity.name, {
      isAdmin: false,
    });
    userAccessToken = getAccessToken(user.auth0Id);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('returns all users for an admin', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/user')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(body).toHaveLength(2);
    });

    it('returns 401 for a new user and creates a database record', async () => {
      await clearDatabase();
      const users = await getRepository(UserEntity).find();
      expect(users).toHaveLength(0);

      const { body } = await request(app.getHttpServer())
        .get('/user')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(401);

      expect(body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });

      const usersAfter = await getRepository(UserEntity).find();
      expect(usersAfter).toHaveLength(1);
      expect(usersAfter[0]).toMatchObject({ isAdmin: false });
    });

    it('returns 401 for a regular user', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/user')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(401);

      expect(body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });
  });

  describe('GET /user/me', () => {
    it('returns current user info for an authenticated user', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/user/me')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      expect(body).toEqual({
        isAdmin: false,
      });
    });

    it('returns admin status for an admin user', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/user/me')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(body).toEqual({
        isAdmin: true,
      });
    });

    it('creates a new user record when making first request', async () => {
      await clearDatabase();
      const users = await getRepository(UserEntity).find();
      expect(users).toHaveLength(0);

      const newUserToken = getAccessToken('new-auth0-id');

      const { body } = await request(app.getHttpServer())
        .get('/user/me')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(body).toEqual({
        isAdmin: false,
      });

      const usersAfter = await getRepository(UserEntity).find();
      expect(usersAfter).toHaveLength(1);
      expect(usersAfter[0]).toMatchObject({
        isAdmin: false,
        auth0Id: 'new-auth0-id',
      });
    });

    it('returns 401 for unauthenticated request', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/user/me')
        .set('Content-Type', 'application/json')
        .expect(401);

      expect(body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });
  });
});
