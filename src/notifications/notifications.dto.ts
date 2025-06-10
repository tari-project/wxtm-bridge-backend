import { IsNotEmpty, IsString } from 'class-validator';

export class NotificationDTO {
  @IsString()
  @IsNotEmpty()
  message: string;
}
