import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { NotificationsService } from './notifications.service';
import { MintHightTransactionReqDTO } from './notifications.dto';
import { M2MAuthGuard } from '../m2m-auth/m2m-auth.guard';
import { SuccessDTO } from '../dto/success.dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('mint-high-transaction')
  @M2MAuthGuard({
    description: 'Send mint high transaction notification',
  })
  sendMintHighTransactionNotification(
    @Body() { safeTxHash }: MintHightTransactionReqDTO,
  ): Promise<SuccessDTO> {
    return this.notificationsService.sendMintHighTransactionNotification(
      safeTxHash,
    );
  }

  @Post('daily-limit-exceeded')
  @M2MAuthGuard({
    description: 'Send daily limit exceeded notification',
  })
  sendDailyLimitExceededNotification(): Promise<SuccessDTO> {
    return this.notificationsService.sendDailyLimitExceededNotification();
  }
}
