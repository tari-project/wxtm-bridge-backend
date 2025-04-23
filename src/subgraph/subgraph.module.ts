import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SubgraphService } from './subgraph.service';
import { UserEntity } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [SubgraphService],
  exports: [SubgraphService],
})
export class SubgraphModule {}
