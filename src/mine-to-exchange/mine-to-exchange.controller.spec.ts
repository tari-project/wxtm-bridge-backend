import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import config from '../config/config';
import { MineToExchangeModule } from './mine-to-exchange.module';
import { MineToExchangeConfigDTO } from './mine-to-exchange.dto';
import { setMiddlewares } from '../helpers/setMiddlewares';

describe('MineToExchangeController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              ...config(),
              mineToExchange: {
                walletAddress: '0xTestWalletAddress',
                addressPrefix: 'eth-mainnet',
              },
            }),
          ],
          isGlobal: true,
        }),
        MineToExchangeModule,
      ],
    }).compile();

    app = module.createNestApplication({ bodyParser: true });
    setMiddlewares(app);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /mine-to-exchange/config', () => {
    it('returns walletAddress and paymentId', async () => {
      const dto: MineToExchangeConfigDTO = {
        toAddress: '0xD34dB33F000000000000000000000000DeAdBeEf',
      };

      const { body } = await request(app.getHttpServer())
        .post('/mine-to-exchange/config')
        .set('Content-Type', 'application/json')
        .send(dto)
        .expect(201);

      expect(body).toEqual({
        walletAddress: '0xTestWalletAddress',
        paymentId: `eth-mainnet:0xD34dB33F000000000000000000000000DeAdBeEf`,
      });
    });
  });
});
