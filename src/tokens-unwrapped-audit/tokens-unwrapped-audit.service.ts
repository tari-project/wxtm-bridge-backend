import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IConfig } from '../config/config.interface';
import { TokensUnwrappedAuditEntity } from './tokens-unwrapped-audit.entity';
import { RecordTransactionEventParams } from './tokens-unwrapped-audit.types';

@Injectable()
export class TokensUnwrappedAuditService {
  constructor(
    protected readonly configService: ConfigService<IConfig, true>,
    @InjectRepository(TokensUnwrappedAuditEntity)
    private tokensUnwrappedAuditRepository: Repository<TokensUnwrappedAuditEntity>,
  ) {}

  async recordTransactionEvent({
    fromStatus,
    toStatus,
    paymentId,
    note,
    transactionId,
  }: RecordTransactionEventParams): Promise<void> {
    await this.tokensUnwrappedAuditRepository.save({
      fromStatus,
      toStatus,
      paymentId,
      transactionId,
      note,
    });
  }
}
