import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { SNSEvent } from 'aws-lambda';

import { NotificationsService } from './notifications.service';
import { SlackService } from '../slack/slack.service';
import { SlackServiceMock } from '../../test/mocks/slack.service.mock';
import config from '../config/config';
import { NotificationsModule } from './notifications.module';

describe('NotificationsService', () => {
  let module: TestingModule;
  let service: NotificationsService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              ...config(),
              aws: {
                region: 'us-east-1',
                notificationsTopicArn: 'test-topic-arn',
              },
            }),
          ],
          isGlobal: true,
        }),
        NotificationsModule,
      ],
    })
      .overrideProvider(SlackService)
      .useValue(SlackServiceMock)
      .compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  describe('onEventReceived', () => {
    it('should process SNS event and send message to Slack', async () => {
      const mockSnsEvent: SNSEvent = {
        Records: [
          {
            EventSource: 'aws:sns',
            EventVersion: '1.0',
            EventSubscriptionArn: 'test-subscription-arn',
            Sns: {
              Type: 'Notification',
              MessageId: 'test-message-id',
              TopicArn: 'test-topic-arn',
              Subject: 'Test Subject',
              Message: JSON.stringify({
                origin: 'test-origin',
                message: 'This is a test message',
              }),
              Timestamp: new Date().toISOString(),
              SignatureVersion: '1',
              Signature: 'test-signature',
              SigningCertUrl: 'test-cert-url',
              UnsubscribeUrl: 'test-unsub-url',
              MessageAttributes: {},
            },
          },
        ],
      };

      await service.onEventReceived(mockSnsEvent);

      expect(SlackServiceMock.sendMessage).toHaveBeenCalledTimes(1);
      expect(SlackServiceMock.sendMessage).toHaveBeenCalledWith(
        'This is a test message',
      );
    });
  });
});
