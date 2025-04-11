import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminJwtStrategy } from './auth.admin.guard';
import { Auth0KeysProvider } from './auth.providers';
import { AuthService } from './auth.service';
import { UserEntity } from '../user/user.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([UserEntity])],
  providers: [AdminJwtStrategy, Auth0KeysProvider, AuthService],
  exports: [AdminJwtStrategy],
})
export class AuthModule {}
