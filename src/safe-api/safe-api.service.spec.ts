import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import SafeApiKit from '@safe-global/api-kit';

import config from '../config/config';
import { SafeApiService } from './safe-api.service';
import { SafeApiModule } from './safe-api.module';
import { SafeApiKitMock } from '../../test/mocks/safe-api-kit.mock';

describe('WrapTokenFeesService tests', () => {
  let module: TestingModule;
  let service: SafeApiService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [config], isGlobal: true }),
        SafeApiModule,
      ],
    })
      .overrideProvider(SafeApiKit)
      .useValue(SafeApiKitMock)
      .compile();

    service = module.get(SafeApiService);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  describe('getMultisignTransaction', () => {
    it('should call the method with correct params', async () => {
      const safeTxHash = '0x1234';

      await service.getMultisignTransaction({ safeTxHash });

      expect(SafeApiKitMock.getTransaction).toHaveBeenCalledWith(safeTxHash);
    });
  });
});
