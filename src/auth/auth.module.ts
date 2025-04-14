import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminJwtStrategy } from './auth.admin.guard';
import { Auth0KeysProvider } from './auth.providers';
import { AuthService } from './auth.service';
import { UserEntity } from '../user/user.entity';
import { UserJwtStrategy } from './auth.user.guard';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([UserEntity])],
  providers: [
    AdminJwtStrategy,
    UserJwtStrategy,
    Auth0KeysProvider,
    AuthService,
  ],
  exports: [AdminJwtStrategy, UserJwtStrategy],
})
export class AuthModule {}
