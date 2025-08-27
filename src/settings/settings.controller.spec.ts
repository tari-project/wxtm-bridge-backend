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
import { M2MAuthModule } from '../m2m-auth/m2m-auth.module';

describe('SettingsController', () => {
  let app: INestApplication;
  let factory: Factory;
  let adminAccessToken: string;
  let userAccessToken: string;
  let admin: UserEntity;
  let user: UserEntity;
  const m2mToken = 'test-m2m-auth-token';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [config], isGlobal: true }),
        TestDatabaseModule,
        M2MAuthModule.register({ authToken: m2mToken }),
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
        maxBatchSize: 25,
        maxBatchAgeMs: 10800000,
        batchAmountThreshold: '15000000000000000000000',
      });

      const { body } = await request(app.getHttpServer())
        .get('/settings')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: 1,
          wrapTokensServiceStatus: ServiceStatus.ONLINE,
          maxBatchSize: 25,
          maxBatchAgeMs: 10800000,
          batchAmountThreshold: '15000000000000000000000',
        }),
      );
    });

    it('should return settings for M2M auth with Bearer token', async () => {
      await factory.create<SettingsEntity>(SettingsEntity.name, {
        wrapTokensServiceStatus: ServiceStatus.OFFLINE,
        maxBatchSize: 30,
        maxBatchAgeMs: 7200000,
        batchAmountThreshold: '25000000000000000000000',
      });

      const { body } = await request(app.getHttpServer())
        .get('/settings')
        .set('Authorization', `Bearer ${m2mToken}`)
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: 1,
          wrapTokensServiceStatus: ServiceStatus.OFFLINE,
          maxBatchSize: 30,
          maxBatchAgeMs: 7200000,
          batchAmountThreshold: '25000000000000000000000',
        }),
      );
    });

    it('should return settings for M2M auth with state-machine-auth header', async () => {
      await factory.create<SettingsEntity>(SettingsEntity.name, {
        wrapTokensServiceStatus: ServiceStatus.ONLINE,
        maxBatchSize: 40,
        maxBatchAgeMs: 14400000,
        batchAmountThreshold: '30000000000000000000000',
      });

      const { body } = await request(app.getHttpServer())
        .get('/settings')
        .set('state-machine-auth', m2mToken)
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: 1,
          wrapTokensServiceStatus: ServiceStatus.ONLINE,
          maxBatchSize: 40,
          maxBatchAgeMs: 14400000,
          batchAmountThreshold: '30000000000000000000000',
        }),
      );
    });

    it('should return 401 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/settings')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(401);
    });

    it('should return 401 for invalid M2M token', async () => {
      await request(app.getHttpServer())
        .get('/settings')
        .set('Authorization', 'Bearer invalid-m2m-token')
        .expect(401);
    });

    it('should return 401 with no authentication', async () => {
      await request(app.getHttpServer()).get('/settings').expect(401);
    });
  });

  describe('PUT /settings', () => {
    const dto: UpdateSettingReqDTO = {
      wrapTokensServiceStatus: ServiceStatus.ONLINE,
      maxBatchSize: 20,
      maxBatchAgeMs: 3600000,
      batchAmountThreshold: '15000000000000000000000',
      unwrapManualApprovalThreshold: '200000000000000000000000',
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
      expect(updatedSettings.maxBatchSize).toBe(20);
      expect(updatedSettings.maxBatchAgeMs).toBe(3600000);
      expect(updatedSettings.batchAmountThreshold).toBe(
        '15000000000000000000000',
      );
      expect(updatedSettings.unwrapManualApprovalThreshold).toBe(
        '200000000000000000000000',
      );
    });

    it('should return 401 for non-admin user', async () => {
      await request(app.getHttpServer())
        .put('/settings')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(dto)
        .expect(401);
    });

    describe('batch settings validation', () => {
      it('should reject maxBatchSize below minimum (2)', async () => {
        const invalidDto = {
          ...dto,
          maxBatchSize: 1,
        };

        await request(app.getHttpServer())
          .put('/settings')
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send(invalidDto)
          .expect(400);
      });

      it('should reject maxBatchSize above maximum (50)', async () => {
        const invalidDto = {
          ...dto,
          maxBatchSize: 51,
        };

        await request(app.getHttpServer())
          .put('/settings')
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send(invalidDto)
          .expect(400);
      });

      it('should reject maxBatchAgeMs below minimum (60000)', async () => {
        const invalidDto = {
          ...dto,
          maxBatchAgeMs: 59999,
        };

        await request(app.getHttpServer())
          .put('/settings')
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send(invalidDto)
          .expect(400);
      });

      it('should reject batchAmountThreshold below minimum', async () => {
        const invalidDto = {
          ...dto,
          batchAmountThreshold: '999999999999999999999',
        };

        await request(app.getHttpServer())
          .put('/settings')
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send(invalidDto)
          .expect(400);
      });

      it('should reject batchAmountThreshold above maximum', async () => {
        const invalidDto = {
          ...dto,
          batchAmountThreshold: '5000000000000000000000001',
        };

        await request(app.getHttpServer())
          .put('/settings')
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send(invalidDto)
          .expect(400);
      });
    });
  });
});
