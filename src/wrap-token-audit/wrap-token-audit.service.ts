import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IConfig } from '../config/config.interface';
import { WrapTokenAuditEntity } from './wrap-token-audit.entity';
import { RecordTransactionEventParams } from './wrap-token-audit.types';

@Injectable()
export class WrapTokenAuditService {
  constructor(
    protected readonly configService: ConfigService<IConfig, true>,
    @InjectRepository(WrapTokenAuditEntity)
    private wrapTokenAuditRepository: Repository<WrapTokenAuditEntity>,
  ) {}

  async recordTransactionEvent({
    fromStatus,
    toStatus,
    paymentId,
    note,
    transactionId,
  }: RecordTransactionEventParams): Promise<void> {
    await this.wrapTokenAuditRepository.save({
      fromStatus,
      toStatus,
      paymentId,
      transactionId,
      note,
    });
  }
}
