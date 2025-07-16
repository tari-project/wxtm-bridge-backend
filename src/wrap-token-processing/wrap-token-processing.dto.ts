import { IsNotEmpty, IsNumber, IsNumberString, IsUUID } from 'class-validator';

export class TokensReceivedDTO {
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;

  @IsNumberString()
  @IsNotEmpty()
  amount: string;

  @IsNumber()
  @IsNotEmpty()
  timestamp: number;
}
