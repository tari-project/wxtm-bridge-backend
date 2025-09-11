import { IsNotEmpty, IsNumberString } from 'class-validator';

export class PaymentWalletBalanceDTO {
  @IsNumberString()
  @IsNotEmpty()
  availableBalance: string;

  @IsNumberString()
  @IsNotEmpty()
  pendingOutgoingBalance: string;

  @IsNumberString()
  @IsNotEmpty()
  pendingIncomingBalance: string;

  @IsNumberString()
  @IsNotEmpty()
  timelockedBalance: string;
}

export class PaymentWalletBalanceResponseDTO {
  walletBalance: string;
  pendingTransactionsAmount: string;
  availableWalletBalance: string;
}
