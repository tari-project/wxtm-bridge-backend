import { Module } from '@nestjs/common';

import { TokenFeesService } from './token-fees.service';

@Module({
  providers: [TokenFeesService],
  exports: [TokenFeesService],
})
export class TokenFeesModule {}
