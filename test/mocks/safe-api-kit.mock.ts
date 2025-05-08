import SafeApiKit from '@safe-global/api-kit';

type SafeApiKitMock = {
  [method in keyof SafeApiKit]: jest.Mock;
};

export const SafeApiKitMock = {
  getTransaction: jest.fn(),
} satisfies Partial<SafeApiKitMock>;
