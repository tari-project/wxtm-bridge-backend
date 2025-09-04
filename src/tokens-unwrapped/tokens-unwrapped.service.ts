import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

import { TokensUnwrappedEntity } from './tokens-unwrapped.entity';
import { TokensUnwrappedStatus } from './tokens-unwrapped.const';
import { SuccessDTO } from '../dto/success.dto';
import {
  GetUserUnwrappedTransactionsRespDTO,
  UserUnwrappedTransactionStatus,
} from './tokens-unwrapped.dto';

@Injectable()
export class TokensUnwrappedService extends TypeOrmCrudService<TokensUnwrappedEntity> {
  constructor(
    @InjectRepository(TokensUnwrappedEntity)
    repo: Repository<TokensUnwrappedEntity>,
  ) {
    super(repo);
  }

  async approveTransaction(id: number, userId: number): Promise<SuccessDTO> {
    const transaction = await this.repo.update(
      {
        id,
        status: TokensUnwrappedStatus.CONFIRMED_AWAITING_APPROVAL,
      },
      { status: TokensUnwrappedStatus.CONFIRMED, approvingUserId: userId },
    );

    return { success: !!transaction?.affected };
  }

  private getUserTransactionStatus(
    status: TokensUnwrappedStatus,
  ): UserUnwrappedTransactionStatus {
    switch (status) {
      case TokensUnwrappedStatus.TOKENS_SENT:
        return UserUnwrappedTransactionStatus.SUCCESS;
      case TokensUnwrappedStatus.UNPROCESSABLE:
        return UserUnwrappedTransactionStatus.ERROR;
      case TokensUnwrappedStatus.CONFIRMED:
      case TokensUnwrappedStatus.INIT_SEND_TOKENS:
      case TokensUnwrappedStatus.SENDING_TOKENS:
        return UserUnwrappedTransactionStatus.PROCESSING;

      default:
        return UserUnwrappedTransactionStatus.PENDING;
    }
  }

  async getUserTransactions(
    tariAddress: string,
  ): Promise<GetUserUnwrappedTransactionsRespDTO> {
    const transactions = await this.repo.find({
      where: { targetTariAddress: tariAddress },
      order: { createdAt: 'DESC' },
    });

    return {
      transactions: transactions.map((transaction) => ({
        paymentId: transaction.paymentId,
        destinationAddress: transaction.targetTariAddress,
        amount: transaction.amount,
        amountAfterFee: transaction.amountAfterFee,
        feeAmount: transaction.feeAmount,
        status: this.getUserTransactionStatus(transaction.status),
        createdAt: transaction.createdAt,
        transactionHash: transaction.transactionHash,
      })),
    };
  }
}
