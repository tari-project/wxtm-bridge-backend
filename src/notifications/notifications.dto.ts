import { IsNotEmpty, IsString } from 'class-validator';

export class NotificationDTO {
  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class MintHightTransactionReqDTO {
  @IsString()
  @IsNotEmpty()
  safeTxHash: string;
}
