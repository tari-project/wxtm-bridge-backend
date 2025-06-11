import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { NotificationsService } from './notifications.service';
import { NotificationDTO } from './notifications.dto';
import { M2MAuthGuard } from '../m2m-auth/m2m-auth.guard';
import { SuccessDTO } from '../dto/success.dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @M2MAuthGuard({
    description: 'Send notification',
  })
  sendNotification(@Body() dto: NotificationDTO): Promise<SuccessDTO> {
    return this.notificationsService.emitNotification(dto);
  }
}
