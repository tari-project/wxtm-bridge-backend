import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TokensUnwrappedAuditService } from './tokens-unwrapped-audit.service';
import { TokensUnwrappedAuditEntity } from './tokens-unwrapped-audit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TokensUnwrappedAuditEntity])],
  providers: [TokensUnwrappedAuditService],
  exports: [TokensUnwrappedAuditService],
})
export class TokensUnwrappedAuditModule {}
