import { SNSClient } from '@aws-sdk/client-sns';

type SNSClientMock = {
  [method in keyof SNSClient]: jest.Mock;
};

export const SNSClientMock = {
  send: jest.fn(),
} satisfies Partial<SNSClientMock>;
