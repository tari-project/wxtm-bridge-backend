import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SafeApiKit from '@safe-global/api-kit';

import { SafeApiService } from './safe-api.service';
import { IConfig } from '../config/config.interface';

@Module({
  providers: [
    SafeApiService,
    {
      provide: SafeApiKit,
      useFactory: (configService: ConfigService<IConfig, true>) => {
        const chainId = configService.get('blockchain.chainId', {
          infer: true,
        });

        return new SafeApiKit({ chainId });
      },
      inject: [ConfigService],
    },
  ],
  exports: [SafeApiService],
})
export class SafeApiModule {}
