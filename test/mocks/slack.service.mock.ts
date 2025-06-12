import { SlackService } from '../../src/slack/slack.service';

type SlackServiceMock = {
  [method in keyof SlackService]: jest.Mock;
};

export const SlackServiceMock = {
  sendMessage: jest.fn().mockResolvedValue(undefined),
} satisfies Partial<SlackServiceMock>;
