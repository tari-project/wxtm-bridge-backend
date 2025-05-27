import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { utils } from 'ethers';

import config from '../config/config';
import { WrapTokenFeesService } from './wrap-token-fees.service';
import { WrapTokenFeesModule } from './wrap-token-fees.module';

describe('WrapTokenFeesService tests', () => {
  let module: TestingModule;
  let service: WrapTokenFeesService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [config], isGlobal: true }),
        WrapTokenFeesModule,
      ],
    }).compile();

    service = module.get(WrapTokenFeesService);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  describe('calculateFee', () => {
    it('should correctly calculate fee', () => {
      const tokenAmount = utils.parseUnits('100', 6).toString();

      const result = service.calculateFee({
        tokenAmount,
      });

      expect(utils.formatUnits(result.feeAmount, 6)).toEqual('0.5');
      expect(utils.formatUnits(result.amountAfterFee, 6)).toEqual('99.5');
    });
  });
});
