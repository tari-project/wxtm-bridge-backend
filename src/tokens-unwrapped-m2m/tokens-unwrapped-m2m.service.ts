import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { TokensUnwrappedStatus } from '../tokens-unwrapped/tokens-unwrapped.const';
import {
  TokensUnwrappedSetErrorDTO,
  UpdateSendingTokensDTO,
  UpdateToTokensSentDTO,
} from './tokens-unwrapped-m2m.dto';
import { SuccessDTO } from '../dto/success.dto';
import { TransactionEvaluationService } from '../transaction-evaluation/transaction-evaluation.service';
import { TokensUnwrappedAuditService } from '../tokens-unwrapped-audit/tokens-unwrapped-audit.service';
import { SettingsEntity } from '../settings/settings.entity';
import { verifyUpdateApplied } from '../helpers/verifyUpdateApplied';

@Injectable()
export class TokensUnwrappedM2MService extends TypeOrmCrudService<TokensUnwrappedEntity> {
  constructor(
    @InjectRepository(TokensUnwrappedEntity)
    repo: Repository<TokensUnwrappedEntity>,
    @InjectRepository(SettingsEntity)
    private readonly settingsRepository: Repository<SettingsEntity>,
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

    if (!transaction) {
      throw new BadRequestException(
        `Transaction with paymentId ${paymentId} not found`,
      );
    }

    const updateResults = await this.repo.update(
      {
        paymentId,
        status: TokensUnwrappedStatus.CREATED,
      },
      {
        status: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
      },
    );
    verifyUpdateApplied(updateResults);

    await this.tokensUnwrappedAuditService.recordTransactionEvent({
      transactionId: transaction.id,
      paymentId,
      fromStatus: TokensUnwrappedStatus.CREATED,
      toStatus: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
    });

    return {
      success: true,
    };
  }

  private async getConfirmedTransactionStatus(
    transaction: TokensUnwrappedEntity,
  ): Promise<TokensUnwrappedStatus> {
    const { unwrapManualApprovalThreshold } =
      await this.settingsRepository.findOneByOrFail({ id: 1 });

    if (
      BigInt(transaction.amountAfterFee) >=
      BigInt(unwrapManualApprovalThreshold)
    ) {
      return TokensUnwrappedStatus.CONFIRMED_AWAITING_APPROVAL;
    }

    return TokensUnwrappedStatus.CONFIRMED;
  }

  async updateToConfirmed(paymentId: string): Promise<SuccessDTO> {
    const transaction = await this.repo.findOne({
      where: {
        paymentId,
        status: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
      },
    });

    if (!transaction) {
      throw new BadRequestException(
        `Transaction with paymentId ${paymentId} not found`,
      );
    }

    const status = await this.getConfirmedTransactionStatus(transaction);
    const updateResults = await this.repo.update(
      {
        paymentId,
        status: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
      },
      {
        status,
      },
    );
    verifyUpdateApplied(updateResults);

    await this.tokensUnwrappedAuditService.recordTransactionEvent({
      transactionId: transaction.id,
      paymentId,
      fromStatus: TokensUnwrappedStatus.AWAITING_CONFIRMATION,
      toStatus: status,
    });

    return {
      success: true,
    };
  }

  async updateToInitSendTokens(paymentId: string): Promise<SuccessDTO> {
    const transaction = await this.repo.findOne({
      where: {
        paymentId,
        status: TokensUnwrappedStatus.CONFIRMED,
      },
    });

    if (!transaction) {
      throw new BadRequestException(
        `Transaction with paymentId ${paymentId} not found`,
      );
    }

    const updateResults = await this.repo.update(
      {
        paymentId,
        status: TokensUnwrappedStatus.CONFIRMED,
      },
      {
        status: TokensUnwrappedStatus.INIT_SEND_TOKENS,
      },
    );
    verifyUpdateApplied(updateResults);

    await this.tokensUnwrappedAuditService.recordTransactionEvent({
      transactionId: transaction.id,
      paymentId,
      fromStatus: TokensUnwrappedStatus.CONFIRMED,
      toStatus: TokensUnwrappedStatus.INIT_SEND_TOKENS,
    });

    return {
      success: true,
    };
  }

  async updateToSendingTokens({
    paymentId,
    temporaryTransactionId,
  }: UpdateSendingTokensDTO): Promise<SuccessDTO> {
    const transaction = await this.repo.findOne({
      where: {
        paymentId,
        status: TokensUnwrappedStatus.INIT_SEND_TOKENS,
      },
    });

    if (!transaction) {
      throw new BadRequestException(
        `Transaction with paymentId ${paymentId} not found`,
      );
    }

    const updateResult = await this.repo.update(
      {
        paymentId,
        status: TokensUnwrappedStatus.INIT_SEND_TOKENS,
      },
      {
        status: TokensUnwrappedStatus.SENDING_TOKENS,
        temporaryTransactionId,
      },
    );
    verifyUpdateApplied(updateResult);

    await this.tokensUnwrappedAuditService.recordTransactionEvent({
      transactionId: transaction.id,
      paymentId,
      fromStatus: TokensUnwrappedStatus.INIT_SEND_TOKENS,
      toStatus: TokensUnwrappedStatus.SENDING_TOKENS,
    });

    return {
      success: true,
    };
  }

  async updateToTokensSent({
    paymentId,
    tariBlockHeight,
    tariTxTimestamp,
    tariPaymentReference,
  }: UpdateToTokensSentDTO): Promise<SuccessDTO> {
    const transaction = await this.repo.findOne({
      where: {
        paymentId,
        status: TokensUnwrappedStatus.SENDING_TOKENS,
      },
    });

    if (!transaction) {
      throw new BadRequestException(
        `Transaction with paymentId ${paymentId} not found`,
      );
    }

    const updateResult = await this.repo.update(
      {
        paymentId,
        status: TokensUnwrappedStatus.SENDING_TOKENS,
      },
      {
        status: TokensUnwrappedStatus.TOKENS_SENT,
        temporaryTransactionId: 'n/a',
        tariTxTimestamp,
        tariBlockHeight,
        tariPaymentReference,
      },
    );
    verifyUpdateApplied(updateResult);

    await this.tokensUnwrappedAuditService.recordTransactionEvent({
      transactionId: transaction.id,
      paymentId,
      fromStatus: TokensUnwrappedStatus.SENDING_TOKENS,
      toStatus: TokensUnwrappedStatus.TOKENS_SENT,
    });

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
