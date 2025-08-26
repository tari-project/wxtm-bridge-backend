import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { TokensUnwrappedStatus } from '../tokens-unwrapped/tokens-unwrapped.const';
import { TokensUnwrappedSetErrorDTO } from './tokens-unwrapped-m2m.dto';
import { SuccessDTO } from '../dto/success.dto';
import { TransactionEvaluationService } from '../transaction-evaluation/transaction-evaluation.service';
import { TokensUnwrappedAuditService } from '../tokens-unwrapped-audit/tokens-unwrapped-audit.service';

@Injectable()
export class TokensUnwrappedM2MService extends TypeOrmCrudService<TokensUnwrappedEntity> {
  constructor(
    @InjectRepository(TokensUnwrappedEntity)
    repo: Repository<TokensUnwrappedEntity>,
    private readonly transactionEvaluationService: TransactionEvaluationService,
    private readonly tokensUnwrappedAuditService: TokensUnwrappedAuditService,
  ) {
    super(repo);
  }

  async updateToAwaitingConfirmation(paymentId: string): Promise<SuccessDTO> {
    const transaction = await this.repo.findOne({
      where: {
        paymentId,
        status: TokensUnwrappedStatus.CREATED,
      },
    });

    if (transaction) {
      await this.repo.update(
        {
          paymentId,
          status: TokensUnwrappedStatus.CREATED,
        },
        {
          status: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
        },
      );

      await this.tokensUnwrappedAuditService.recordTransactionEvent({
        transactionId: transaction.id,
        paymentId,
        fromStatus: TokensUnwrappedStatus.CREATED,
        toStatus: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
      });
    }

    return {
      success: true,
    };
  }

  async updateToConfirmed(paymentId: string): Promise<SuccessDTO> {
    const transaction = await this.repo.findOne({
      where: {
        paymentId,
        status: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
      },
    });

    if (transaction) {
      await this.repo.update(
        {
          paymentId,
          status: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
        },
        {
          status: TokensUnwrappedStatus.CONFIRMED,
        },
      );

      await this.tokensUnwrappedAuditService.recordTransactionEvent({
        transactionId: transaction.id,
        paymentId,
        fromStatus: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
        toStatus: TokensUnwrappedStatus.CONFIRMED,
      });
    }

    return {
      success: true,
    };
  }

  async setCurrentError({
    paymentId,
    error,
  }: TokensUnwrappedSetErrorDTO): Promise<SuccessDTO> {
    const transaction = await this.repo.findOne({
      where: {
        paymentId,
      },
    });

    if (transaction && transaction.error.length < 10) {
      await this.repo.update(
        {
          id: transaction.id,
        },
        {
          error: [...transaction.error, error],
        },
      );

      await this.transactionEvaluationService.evaluateTokensUnwrappedErrors(
        transaction.id,
      );
    }

    return {
      success: true,
    };
  }
}
