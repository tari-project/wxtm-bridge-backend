import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IConfig } from '../config/config.interface';
import { MineToExchangeConfigRespDTO } from './mine-to-exchange.dto';

@Injectable()
export class MineToExchangeService {
  constructor(private readonly configService: ConfigService<IConfig, true>) {}

  async getConfig(toAddress: string): Promise<MineToExchangeConfigRespDTO> {
    const { addressPrefix, walletAddress } = this.configService.get(
      'mineToExchange',
      { infer: true },
    );

    return {
      walletAddress,
      paymentId: `${addressPrefix}:${toAddress}`,
    };
  }
}
