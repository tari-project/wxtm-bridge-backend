import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ethers } from 'ethers';

import { ExceptionsMessages } from '../consts/exceptions-messages';
import { SuccessDTO } from '../dto/success.dto';
import {
  CreateWrapTokenReqDTO,
  CreateWrapTokenRespDTO,
  GetUserTransactionsRespDTO,
  GetWrapTokenParamsRespDTO,
  GetWrapTokenServiceStatusRespDTO,
  UpdateToTokensSentReqDTO,
  UserTransactionStatus,
} from './wrap-token.dto';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { TokenFeesService } from '../token-fees/token-fees.service';
import { ConfigService } from '@nestjs/config';
import { IConfig } from '../config/config.interface';
import { WrapTokenAuditService } from '../wrap-token-audit/wrap-token-audit.service';
import { SettingsEntity } from '../settings/settings.entity';
import { ServiceStatus } from '../settings/settings.const';

@Injectable()
export class WrapTokenService {
  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    private readonly wrapTokenTransactionRepository: Repository<WrapTokenTransactionEntity>,
    @InjectRepository(SettingsEntity)
    private readonly settingsRepository: Repository<SettingsEntity>,
    private readonly tokenFeesService: TokenFeesService,
    private readonly configService: ConfigService<IConfig, true>,
    private readonly wrapTokenAuditService: WrapTokenAuditService,
  ) {}

  async createWrapTokenTransaction({
    from,
    to,
    tokenAmount,
    debug,
  }: CreateWrapTokenReqDTO): Promise<CreateWrapTokenRespDTO> {
    const settings = await this.settingsRepository.findOneByOrFail({ id: 1 });

    if (settings.wrapTokensServiceStatus === ServiceStatus.OFFLINE) {
      throw new BadRequestException('Wrap token service is currently offline');
    }

    const { amountAfterFee, feeAmount, feePercentageBps } =
      this.tokenFeesService.calculateWrapFee({
        tokenAmount,
      });

    const canonicalAddress = ethers.utils.getAddress(to);
    const { paymentId, id, status } =
      await this.wrapTokenTransactionRepository.save({
        from,
        to: canonicalAddress,
        tokenAmount,
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
        transactionHash: transaction.transactionHash,
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

  async getServiceStatus(): Promise<GetWrapTokenServiceStatusRespDTO> {
    const { wrapTokensServiceStatus } =
      await this.settingsRepository.findOneByOrFail({ id: 1 });

    return {
      status: wrapTokensServiceStatus,
    };
  }
}
