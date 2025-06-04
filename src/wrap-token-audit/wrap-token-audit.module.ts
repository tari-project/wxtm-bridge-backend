import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WrapTokenAuditService } from './wrap-token-audit.service';
import { WrapTokenAuditEntity } from './wrap-token-audit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WrapTokenAuditEntity])],
  providers: [WrapTokenAuditService],
  exports: [WrapTokenAuditService],
})
export class WrapTokenAuditModule {}
