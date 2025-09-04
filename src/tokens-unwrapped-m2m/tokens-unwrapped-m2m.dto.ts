import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateTokensUnwrappedStatusDTO {
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;
}

export class TokensUnwrappedSetErrorDTO {
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
  })
  @IsNotEmpty()
  error: Record<string, string>;
}

export class UpdateSendingTokensDTO extends UpdateTokensUnwrappedStatusDTO {
  @IsNumberString()
  @IsNotEmpty()
  temporaryTransactionId: string;
}

export class UpdateToTokensSentDTO extends UpdateTokensUnwrappedStatusDTO {
  @IsNumber()
  @IsNotEmpty()
  tariTxTimestamp: number;

  @IsNumber()
  @IsNotEmpty()
  tariBlockHeight: number;

  @IsString()
  @IsNotEmpty()
  tariPaymentReference: string;
}
