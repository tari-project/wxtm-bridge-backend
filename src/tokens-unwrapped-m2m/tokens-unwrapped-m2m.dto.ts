import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

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
