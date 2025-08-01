import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { MineToExchangeService } from './mine-to-exchange.service';
import { MineToExchangeModule } from './mine-to-exchange.module';
import config from '../config/config';
import { TestDatabaseModule } from '../../test/database';

describe('MineToExchangeService', () => {
  let service: MineToExchangeService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              ...config(),
              mineToExchange: {
                addressPrefix: 'eth-mainnet',
                minTokenAmount: '100',
              },
            }),
          ],
          isGlobal: true,
        }),
        MineToExchangeModule,
        TestDatabaseModule,
      ],
    }).compile();

    service = module.get<MineToExchangeService>(MineToExchangeService);
  });

  describe('parseUserPaymentId', () => {
    const ethAddress = '0x1234567890123456789012345678901234567890';

    it('should return eth address for valid user payment id', () => {
      const userPaymentId = `eth-mainnet:${ethAddress}`;

      expect(
        // @ts-expect-error: testing private method
        service.parseUserPaymentId(userPaymentId),
      ).toBe(ethAddress);
    });

    it('should return undefined for invalid eth address', () => {
      const invalidEthAddress = '0xINVALIDADDRESS';
      const userPaymentId = `eth-mainnet:${invalidEthAddress}`;

      expect(
        // @ts-expect-error: testing private method
        service.parseUserPaymentId(userPaymentId),
      ).toBeUndefined();
    });

    it('should return undefined for incorrect prefix', () => {
      const userPaymentId = `wrong-prefix:${ethAddress}`;

      expect(
        // @ts-expect-error: testing private method
        service.parseUserPaymentId(userPaymentId),
      ).toBeUndefined();
    });

    it('should return undefined when payment id is just a uuid', () => {
      const uuid = 'b3b7c9e2-8f7b-4e2c-9e7b-2f7b8e7b9e7b';

      expect(
        // @ts-expect-error: testing private method
        service.parseUserPaymentId(uuid),
      ).toBeUndefined();
    });
  });

  describe('validateMinAmount', () => {
    it('should return true when tokenAmount is equal to minTokenAmount', () => {
      expect(
        // @ts-expect-error: testing private method
        service.validateMinAmount('100'),
      ).toBe(true);
    });

    it('should return true when tokenAmount is greater than minTokenAmount', () => {
      expect(
        // @ts-expect-error: testing private method
        service.validateMinAmount('101'),
      ).toBe(true);
    });

    it('should return false when tokenAmount is less than minTokenAmount', () => {
      expect(
        // @ts-expect-error: testing private method
        service.validateMinAmount('99'),
      ).toBe(false);
    });
  });
});
