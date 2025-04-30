import { Controller, Patch, Param, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { SuccessDTO } from '../dto/success.dto';
import { WrapTokenService } from './wrap-token.service';
import {
  CreateWrapTokenReqDTO,
  CreateWrapTokenRespDTO,
} from './wrap-token.dto';

@ApiTags('wrap-token')
@Controller('wrap-token')
export class WrapTokenController {
  constructor(private service: WrapTokenService) {}

  @Post()
  @ApiOperation({ summary: 'Creates wrap token transaction' })
  createWrapTokenTransaction(
    @Body() dto: CreateWrapTokenReqDTO,
  ): Promise<CreateWrapTokenRespDTO> {
    return this.service.createWrapTokenTransaction(dto);
  }

  @Patch('tokens-sent/:paymentId')
  @ApiOperation({ summary: 'Update transaction status to tokens sent' })
  updateToTokensSent(
    @Param('paymentId') paymentId: string,
  ): Promise<SuccessDTO> {
    return this.service.updateToTokensSent(paymentId);
  }
}
