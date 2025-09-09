import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentWalletBalanceEntity } from './payment-wallet-balance.entity';
import { PaymentWalletBalanceDTO } from './payment-wallet-balance.dto';
import { SuccessDTO } from '../dto/success.dto';

@Injectable()
export class PaymentWalletBalanceService {
  constructor(
    @InjectRepository(PaymentWalletBalanceEntity)
    private readonly paymentWalletBalanceRepository: Repository<PaymentWalletBalanceEntity>,
  ) {}

  async setBalance({
    availableBalance,
    pendingIncomingBalance,
    pendingOutgoingBalance,
    timelockedBalance,
  }: PaymentWalletBalanceDTO): Promise<SuccessDTO> {
    const { id } = await this.paymentWalletBalanceRepository.findOneByOrFail({
      id: 1,
    });

    await this.paymentWalletBalanceRepository.update(id, {
      availableBalance,
      pendingIncomingBalance,
      pendingOutgoingBalance,
      timelockedBalance,
    });

    return { success: true };
  }
}
