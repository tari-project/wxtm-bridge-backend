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
import { setMiddlewares } from '../helpers/setMiddlewares';
import { Auth0Keys } from '../auth/auth.providers';
import { Auth0KeysMock } from '../../test/mocks/auth0-keys.mock';
import { getAccessToken } from '../../test/utils/getAccessToken';
import { Factory, getFactory } from '../../test/factory/factory';
import { SettingsModule } from './settings.module';
import { UserEntity } from '../user/user.entity';
import { SettingsEntity } from './settings.entity';
import { ServiceStatus } from './settings.const';
import { UpdateSettingReqDTO } from './settings.dto';

describe('SettingsController', () => {
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
        SettingsModule,
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

  describe('GET /settings', () => {
    it('should return settings for admin user', async () => {
      await factory.create<SettingsEntity>(SettingsEntity.name, {
        wrapTokensServiceStatus: ServiceStatus.ONLINE,
      });

      const { body } = await request(app.getHttpServer())
        .get('/settings')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: 1,
          wrapTokensServiceStatus: ServiceStatus.ONLINE,
        }),
      );
    });

    it('should return 401 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/settings')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(401);
    });
  });

  describe('PUT /settings', () => {
    const dto: UpdateSettingReqDTO = {
      wrapTokensServiceStatus: ServiceStatus.ONLINE,
    };
    it('should update settings for admin user', async () => {
      const settings = await factory.create<SettingsEntity>(
        SettingsEntity.name,
      );

      const { body } = await request(app.getHttpServer())
        .put('/settings')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto)
        .expect(200);

      expect(body).toEqual({ success: true });

      const updatedSettings = await getRepository(
        SettingsEntity,
      ).findOneByOrFail({
        id: settings.id,
      });

      expect(updatedSettings.wrapTokensServiceStatus).toBe(
        ServiceStatus.ONLINE,
      );
    });

    it('should return 401 for non-admin user', async () => {
      await request(app.getHttpServer())
        .put('/settings')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(dto)
        .expect(401);
    });
  });
});
