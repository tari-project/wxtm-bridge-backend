import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { TokensUnwrappedStatus } from '../tokens-unwrapped/tokens-unwrapped.const';
import { TokensUnwrappedSetErrorDTO } from './tokens-unwrapped-m2m.dto';
import { SuccessDTO } from '../dto/success.dto';
import { TransactionEvaluationService } from '../transaction-evaluation/transaction-evaluation.service';

@Injectable()
export class TokensUnwrappedM2MService extends TypeOrmCrudService<TokensUnwrappedEntity> {
  constructor(
    @InjectRepository(TokensUnwrappedEntity)
    repo: Repository<TokensUnwrappedEntity>,
    private readonly transactionEvaluationService: TransactionEvaluationService,
  ) {
    super(repo);
  }

  async updateToAwaitingConfirmation(paymentId: string): Promise<SuccessDTO> {
    await this.repo.update(
      {
        paymentId,
        status: TokensUnwrappedStatus.CREATED,
      },
      {
        status: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
      },
    );

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
