import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ExceptionsMessages } from '../consts/exceptions-messages';
import { SuccessDTO } from '../dto/success.dto';
import {
  CreateWrapTokenReqDTO,
  CreateWrapTokenRespDTO,
  GetUserTransactionsRespDTO,
  GetWrapTokenParamsRespDTO,
  UpdateToTokensSentReqDTO,
  UserTransactionStatus,
} from './wrap-token.dto';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { WrapTokenFeesService } from '../wrap-token-fees/wrap-token-fees.service';
import { ConfigService } from '@nestjs/config';
import { IConfig } from '../config/config.interface';
import { WrapTokenAuditService } from '../wrap-token-audit/wrap-token-audit.service';

@Injectable()
export class WrapTokenService {
  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    private readonly wrapTokenTransactionRepository: Repository<WrapTokenTransactionEntity>,
    private readonly wrapTokenFeesService: WrapTokenFeesService,
    private readonly configService: ConfigService<IConfig, true>,
    private readonly wrapTokenAuditService: WrapTokenAuditService,
  ) {}

  async createWrapTokenTransaction({
    from,
    to,
    tokenAmount,
    debug,
  }: CreateWrapTokenReqDTO): Promise<CreateWrapTokenRespDTO> {
    const { amountAfterFee, feeAmount, feePercentageBps } =
      this.wrapTokenFeesService.calculateFee({
        tokenAmount,
      });

    const { paymentId, id, status } =
      await this.wrapTokenTransactionRepository.save({
        from,
        to,
        tokenAmount,
        userProvidedTokenAmount: tokenAmount,
        feePercentageBps,
        feeAmount,
        amountAfterFee,
        debug: debug && { data_1: debug },
      });

    await this.wrapTokenAuditService.recordTransactionEvent({
      transactionId: id,
      paymentId,
      toStatus: status,
    });

    return {
      paymentId,
    };
  }

  private async resolveTransactionByPaymentId(
    paymentId: string,
  ): Promise<WrapTokenTransactionEntity> {
    const transaction = await this.wrapTokenTransactionRepository.findOne({
      where: { paymentId },
    });

    if (!transaction) {
      throw new BadRequestException(ExceptionsMessages.TRANSACTION_NOT_FOUND);
    }

    return transaction;
  }

  async updateToTokensSent(
    paymentId: string,
    dto?: UpdateToTokensSentReqDTO,
  ): Promise<SuccessDTO> {
    const transaction = await this.resolveTransactionByPaymentId(paymentId);

    if (transaction.status !== WrapTokenTransactionStatus.CREATED) {
      throw new BadRequestException(
        ExceptionsMessages.TRANSACTION_STATUS_INCORRECT,
      );
    }

    await this.wrapTokenTransactionRepository.save({
      ...transaction,
      status: WrapTokenTransactionStatus.TOKENS_SENT,
      debug: dto?.debug && { ...transaction.debug, data_2: dto.debug },
    });

    await this.wrapTokenAuditService.recordTransactionEvent({
      transactionId: transaction.id,
      paymentId,
      fromStatus: transaction.status,
      toStatus: WrapTokenTransactionStatus.TOKENS_SENT,
    });

    return {
      success: true,
    };
  }

  private getUserTransactionStatus(
    status: WrapTokenTransactionStatus,
  ): UserTransactionStatus {
    switch (status) {
      case WrapTokenTransactionStatus.TOKENS_RECEIVED:
        return UserTransactionStatus.TOKENS_RECEIVED;
      case WrapTokenTransactionStatus.SAFE_TRANSACTION_CREATED:
        return UserTransactionStatus.PROCESSING;
      case WrapTokenTransactionStatus.EXECUTING_SAFE_TRANSACTION:
        return UserTransactionStatus.PROCESSING;
      case WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED:
        return UserTransactionStatus.SUCCESS;
      case WrapTokenTransactionStatus.TIMEOUT:
        return UserTransactionStatus.TIMEOUT;

      default:
        return UserTransactionStatus.PENDING;
    }
  }

  async getUserTransactions(
    walletAddress: string,
  ): Promise<GetUserTransactionsRespDTO> {
    const transactions = await this.wrapTokenTransactionRepository.find({
      where: { from: walletAddress },
      order: { createdAt: 'DESC' },
    });

    return {
      transactions: transactions.map((transaction) => ({
        paymentId: transaction.paymentId,
        destinationAddress: transaction.to,
        tokenAmount: transaction.tokenAmount,
        amountAfterFee: transaction.amountAfterFee,
        feeAmount: transaction.feeAmount,
        createdAt: transaction.createdAt,
        status: this.getUserTransactionStatus(transaction.status),
      })),
    };
  }

  getWrapTokenParams(): GetWrapTokenParamsRespDTO {
    return {
      coldWalletAddress: this.configService.get('coldWalletAddress', {
        infer: true,
      }),
      wrapTokenFeePercentageBps: this.configService.get(
        'fees.wrapTokenFeePercentageBps',
        {
          infer: true,
        },
      ),
    };
  }
}
