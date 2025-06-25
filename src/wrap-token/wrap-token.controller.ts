import {
  Controller,
  Patch,
  Param,
  Post,
  Body,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

import { SuccessDTO } from '../dto/success.dto';
import { WrapTokenService } from './wrap-token.service';
import {
  CreateWrapTokenReqDTO,
  CreateWrapTokenRespDTO,
  GetUserTransactionsRespDTO,
  GetWrapTokenParamsRespDTO,
  UpdateToTokensSentReqDTO,
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

  @Get('transactions')
  @ApiOperation({ summary: 'Get all transactions by from address' })
  getUserTransactions(
    @Query('walletAddress') walletAddress: string,
  ): Promise<GetUserTransactionsRespDTO> {
    return this.service.getUserTransactions(walletAddress);
  }

  @Get('params')
  @ApiOperation({
    summary: 'Returns params for creating wrap token transaction',
  })
  getWrapTokenParams(): GetWrapTokenParamsRespDTO {
    return this.service.getWrapTokenParams();
  }

  @Patch('tokens-sent/:paymentId')
  @ApiOperation({ summary: 'Update transaction status to tokens sent' })
  @ApiBody({
    type: UpdateToTokensSentReqDTO,
    required: false,
  })
  updateToTokensSent(
    @Param('paymentId') paymentId: string,
    @Body() dto?: UpdateToTokensSentReqDTO,
  ): Promise<SuccessDTO> {
    return this.service.updateToTokensSent(paymentId, dto);
  }
}
