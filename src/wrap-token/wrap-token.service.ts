import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ExceptionsMessages } from '../consts/exceptions-messages';
import { SuccessDTO } from '../dto/success.dto';
import {
  CreateWrapTokenReqDTO,
  CreateWrapTokenRespDTO,
  GetUserTransactionsRespDTO,
  UserTransactionStatus,
} from './wrap-token.dto';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';
import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { WrapTokenFeesService } from '../wrap-token-fees/wrap-token-fees.service';

@Injectable()
export class WrapTokenService {
  constructor(
    @InjectRepository(WrapTokenTransactionEntity)
    private readonly wrapTokenTransactionRepository: Repository<WrapTokenTransactionEntity>,
    private readonly wrapTokenFeesService: WrapTokenFeesService,
  ) {}

  async createWrapTokenTransaction({
    from,
    to,
    tokenAmount,
  }: CreateWrapTokenReqDTO): Promise<CreateWrapTokenRespDTO> {
    const { amountAfterFee, feeAmount, feePercentageBps } =
      this.wrapTokenFeesService.calculateFee({
        tokenAmount,
      });

    const { paymentId } = await this.wrapTokenTransactionRepository.save({
      from,
      to,
      tokenAmount,
      userProvidedTokenAmount: tokenAmount,
      feePercentageBps,
      feeAmount,
      amountAfterFee,
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

  async updateToTokensSent(paymentId: string): Promise<SuccessDTO> {
    const transaction = await this.resolveTransactionByPaymentId(paymentId);

    if (transaction.status !== WrapTokenTransactionStatus.CREATED) {
      throw new BadRequestException(
        ExceptionsMessages.TRANSACTION_STATUS_INCORRECT,
      );
    }

    await this.wrapTokenTransactionRepository.save({
      ...transaction,
      status: WrapTokenTransactionStatus.TOKENS_SENT,
    });

    return {
      success: true,
    };
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
        tokenAmount: transaction.tokenAmount,
        amountAfterFee: transaction.amountAfterFee,
        feeAmount: transaction.feeAmount,
        createdAt: transaction.createdAt,
        status:
          transaction.status ===
          WrapTokenTransactionStatus.SAFE_TRANSACTION_EXECUTED
            ? UserTransactionStatus.SUCCESS
            : UserTransactionStatus.PENDING,
      })),
    };
  }
}
