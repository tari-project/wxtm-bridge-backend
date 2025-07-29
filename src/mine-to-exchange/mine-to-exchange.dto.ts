import { IsEthereumAddress, IsNotEmpty } from 'class-validator';

export class MineToExchangeConfigDTO {
  @IsEthereumAddress()
  @IsNotEmpty()
  toAddress: string;
}

export class MineToExchangeConfigRespDTO {
  walletAddress: string;
  paymentId: string;
}
