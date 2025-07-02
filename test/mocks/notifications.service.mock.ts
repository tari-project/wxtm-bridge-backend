import { NotificationsService } from '../../src/notifications/notifications.service';

type NotificationsServiceMock = {
  [method in keyof NotificationsService]: jest.Mock;
};

export const NotificationsServiceMock = {
  emitNotification: jest.fn().mockResolvedValue({ success: true }),
  onEventReceived: jest.fn(),
  sendTransactionUnprocessableNotification: jest.fn(),
} satisfies Partial<NotificationsServiceMock>;
