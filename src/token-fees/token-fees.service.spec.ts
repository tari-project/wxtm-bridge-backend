import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { utils } from 'ethers';

import config from '../config/config';
import { TokenFeesService } from './token-fees.service';
import { TokenFeesModule } from './token-fees.module';

describe('TokenFeesService tests', () => {
  let module: TestingModule;
  let service: TokenFeesService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [config], isGlobal: true }),
        TokenFeesModule,
      ],
    }).compile();

    service = module.get(TokenFeesService);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  describe('calculateWrapFee', () => {
    it('should correctly calculate fee', () => {
      const tokenAmount = utils.parseUnits('100', 6).toString();

      const result = service.calculateWrapFee({
        tokenAmount,
      });

      expect(utils.formatUnits(result.feeAmount, 6)).toEqual('0.5');
      expect(utils.formatUnits(result.amountAfterFee, 6)).toEqual('99.5');
    });
  });

  describe('calculateUnwrapFee', () => {
    it('should correctly calculate fee', () => {
      const tokenAmount = utils.parseUnits('100', 18).toString();

      const result = service.calculateUnwrapFee({
        tokenAmount,
      });

      expect(utils.formatUnits(result.feeAmount, 18)).toEqual('0.5');
      expect(utils.formatUnits(result.amountAfterFee, 18)).toEqual('99.5');
    });
  });
});
