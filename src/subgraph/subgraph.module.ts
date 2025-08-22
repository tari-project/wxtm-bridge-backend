import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SubgraphService } from './subgraph.service';
import { SubgraphClientService } from '../subgraph-client/subgraph-client.service';
import { UserEntity } from '../user/user.entity';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { TokenFeesModule } from '../token-fees/token-fees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, TokensUnwrappedEntity]),
    TokenFeesModule,
  ],
  providers: [SubgraphService, SubgraphClientService],
  exports: [SubgraphService],
})
export class SubgraphModule {}
