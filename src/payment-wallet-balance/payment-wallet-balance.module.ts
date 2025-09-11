import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentWalletBalanceService } from './payment-wallet-balance.service';
import { PaymentWalletBalanceController } from './payment-wallet-balance.controller';
import { PaymentWalletBalanceEntity } from './payment-wallet-balance.entity';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentWalletBalanceEntity,
      TokensUnwrappedEntity,
    ]),
    AuthModule,
  ],
  providers: [PaymentWalletBalanceService],
  controllers: [PaymentWalletBalanceController],
})
export class PaymentWalletBalanceModule {}
