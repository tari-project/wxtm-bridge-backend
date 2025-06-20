import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { SNSClient } from '@aws-sdk/client-sns';

import { setMiddlewares } from '../helpers/setMiddlewares';
import { NotificationsModule } from './notifications.module';
import { MintHightTransactionReqDTO } from './notifications.dto';
import { M2MAuthModule } from '../m2m-auth/m2m-auth.module';
import { SNSClientMock } from '../../test/mocks/sns-client.mock';
import config from '../config/config';

describe('NotificationsController', () => {
  let app: INestApplication;
  const m2mToken = 'test-m2m-auth-token';
  const domain = 'example.com';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              ...config(),
              domain,
              aws: {
                region: 'us-east-1',
                notificationsTopicArn: 'test-topic-arn',
              },
            }),
          ],
          isGlobal: true,
        }),
        M2MAuthModule.register({ authToken: m2mToken }),
        NotificationsModule,
      ],
    })
      .overrideProvider(SNSClient)
      .useValue(SNSClientMock)
      .compile();

    app = module.createNestApplication({ bodyParser: true });
    setMiddlewares(app);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /notifications/mint-high-transaction', () => {
    it('should send mint high transaction notification', async () => {
      const dto: MintHightTransactionReqDTO = {
        safeTxHash: 'test-safe-tx-hash',
      };

      const { body } = await request(app.getHttpServer())
        .post('/notifications/mint-high-transaction')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${m2mToken}`)
        .send(dto)
        .expect(201);

      expect(body).toEqual({ success: true });

      expect(SNSClientMock.send).toHaveBeenCalledTimes(1);

      const callArgs = SNSClientMock.send.mock.calls[0][0];
      expect(callArgs.input).toEqual({
        TopicArn: 'test-topic-arn',
        Message: JSON.stringify({
          message: `Mint high transaction awaiting approval: https://admin.${domain}/safe-transactions/show/${dto.safeTxHash}`,
          origin: 'Processor',
        }),
      });
    });

    it('returns 401 without M2M auth token', async () => {
      const mintHighTransactionDto: MintHightTransactionReqDTO = {
        safeTxHash: 'test-safe-tx-hash',
      };

      await request(app.getHttpServer())
        .post('/notifications/mint-high-transaction')
        .set('Content-Type', 'application/json')
        .send(mintHighTransactionDto)
        .expect(401);

      expect(SNSClientMock.send).not.toHaveBeenCalled();
    });
  });
});
