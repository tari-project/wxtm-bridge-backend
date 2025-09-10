import { BadRequestException } from '@nestjs/common';
import { UpdateResult } from 'typeorm';

export function verifyUpdateApplied(updateResult?: UpdateResult): void {
  if (!updateResult || !updateResult?.affected || updateResult.affected === 0) {
    throw new BadRequestException('Failed to apply update: no rows affected');
  }
}
