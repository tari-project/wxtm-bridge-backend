import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentWalletBalanceService } from './payment-wallet-balance.service';
import { PaymentWalletBalanceController } from './payment-wallet-balance.controller';
import { PaymentWalletBalanceEntity } from './payment-wallet-balance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentWalletBalanceEntity])],
  providers: [PaymentWalletBalanceService],
  controllers: [PaymentWalletBalanceController],
})
export class PaymentWalletBalanceModule {}
