import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { TokensUnwrappedM2MService } from './tokens-unwrapped-m2m.service';
import { TokensUnwrappedM2MController } from './tokens-unwrapped-m2m.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TokensUnwrappedEntity])],
  providers: [TokensUnwrappedM2MService],
  controllers: [TokensUnwrappedM2MController],
})
export class TokensUnwrappedM2MModule {}
