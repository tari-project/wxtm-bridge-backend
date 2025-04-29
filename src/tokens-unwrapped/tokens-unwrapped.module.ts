import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { TokensUnwrappedEntity } from './tokens-unwrapped.entity';
import { TokensUnwrappedService } from './tokens-unwrapped.service';
import { TokensUnwrappedController } from './tokens-unwrapped.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TokensUnwrappedEntity]), AuthModule],
  providers: [TokensUnwrappedService],
  controllers: [TokensUnwrappedController],
})
export class TokensUnwrappedModule {}
