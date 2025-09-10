import { Body, Controller, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { PaymentWalletBalanceService } from './payment-wallet-balance.service';
import { PaymentWalletBalanceDTO } from './payment-wallet-balance.dto';
import { SuccessDTO } from '../dto/success.dto';
import { M2MAuthGuard } from '../m2m-auth/m2m-auth.guard';

@ApiBearerAuth()
@ApiTags('payment-wallet-balance')
@Controller('payment-wallet-balance')
export class PaymentWalletBalanceController {
  constructor(public service: PaymentWalletBalanceService) {}

  @Patch()
  @M2MAuthGuard({ description: 'Set payment wallet balance' })
  setBalance(@Body() dto: PaymentWalletBalanceDTO): Promise<SuccessDTO> {
    return this.service.setBalance(dto);
  }
}
