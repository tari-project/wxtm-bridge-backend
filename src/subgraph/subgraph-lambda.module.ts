import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import config from '../config/config';
import { DatabaseModule } from '../database/database.module';
import { SubgraphModule } from './subgraph.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    DatabaseModule,
    SubgraphModule,
  ],
})
export class SubgraphLambdaModule {}
