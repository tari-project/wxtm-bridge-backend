import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { SNSEvent } from 'aws-lambda';
import { SNSClient } from '@aws-sdk/client-sns';

import { NotificationsService } from './notifications.service';
import { SlackService } from '../slack/slack.service';
import { SlackServiceMock } from '../../test/mocks/slack.service.mock';
import { SNSClientMock } from '../../test/mocks/sns-client.mock';
import config from '../config/config';
import { NotificationsModule } from './notifications.module';

describe('NotificationsService', () => {
  let module: TestingModule;
  let service: NotificationsService;
  const domain = 'example.com';

  beforeAll(async () => {
    module = await Test.createTestingModule({
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
        NotificationsModule,
      ],
    })
      .overrideProvider(SlackService)
      .useValue(SlackServiceMock)
      .overrideProvider(SNSClient)
      .useValue(SNSClientMock)
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

  describe('sendWrapTokensTransactionUnprocessableNotification', () => {
    it('should send transaction unprocessable notification', async () => {
      const transactionId = 12345;

      const result =
        await service.sendWrapTokensTransactionUnprocessableNotification(
          transactionId,
        );

      expect(result).toEqual({ success: true });
      expect(SNSClientMock.send).toHaveBeenCalledTimes(1);

      const callArgs = SNSClientMock.send.mock.calls[0][0];
      expect(callArgs.input).toEqual({
        TopicArn: 'test-topic-arn',
        Message: JSON.stringify({
          message: `Wrap transaction unprocessible: https://admin.${domain}/wrap-token-transactions/edit/${transactionId}`,
          origin: 'Processor',
        }),
      });
    });
  });

  describe('sendTokensUnwrappedUnprocessableNotification', () => {
    it('should send unwrap transaction unprocessable notification', async () => {
      const transactionId = 12345;

      const result =
        await service.sendTokensUnwrappedUnprocessableNotification(
          transactionId,
        );

      expect(result).toEqual({ success: true });
      expect(SNSClientMock.send).toHaveBeenCalledTimes(1);

      const callArgs = SNSClientMock.send.mock.calls[0][0];
      expect(callArgs.input).toEqual({
        TopicArn: 'test-topic-arn',
        Message: JSON.stringify({
          message: `Unwrap transaction unprocessible: https://admin.${domain}/tokens-unwrapped/edit/${transactionId}`,
          origin: 'Processor',
        }),
      });
    });
  });

  describe('sendTokensUnwrappedRequiresApprovalNotification', () => {
    it('should send unwrap transaction unprocessable notification', async () => {
      const transactionId = 12345;

      const result =
        await service.sendTokensUnwrappedRequiresApprovalNotification(
          transactionId,
        );

      expect(result).toEqual({ success: true });
      expect(SNSClientMock.send).toHaveBeenCalledTimes(1);

      const callArgs = SNSClientMock.send.mock.calls[0][0];
      expect(callArgs.input).toEqual({
        TopicArn: 'test-topic-arn',
        Message: JSON.stringify({
          message: `Unwrap transaction requires approval: https://admin.${domain}/tokens-unwrapped/edit/${transactionId}`,
          origin: 'Processor',
        }),
      });
    });
  });
});
