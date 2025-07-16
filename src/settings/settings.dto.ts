import { IsEnum, IsNotEmpty } from 'class-validator';

import { ServiceStatus } from './settings.const';

export class UpdateSettingReqDTO {
  @IsEnum(ServiceStatus)
  @IsNotEmpty()
  wrapTokensServiceStatus: ServiceStatus;
}
