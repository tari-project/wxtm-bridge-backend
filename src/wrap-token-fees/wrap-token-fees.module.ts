import { Module } from '@nestjs/common';

import { WrapTokenFeesService } from './wrap-token-fees.service';

@Module({
  providers: [WrapTokenFeesService],
  exports: [WrapTokenFeesService],
})
export class WrapTokenFeesModule {}
