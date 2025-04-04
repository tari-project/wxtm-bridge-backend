import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { IConfig } from '../config/config.interface';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService<IConfig, true>) => {
        return config.get('database');
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
