import { NestFactory } from '@nestjs/core';

import { TransactionTimeoutLambdaModule } from '../transaction-timeout/transaction-timeout-lambda.module';
import { TransactionTimeoutService } from '../transaction-timeout/transaction-timeout.service';

let service: TransactionTimeoutService | undefined;

export const createTransactionTimeoutService =
  async (): Promise<TransactionTimeoutService> => {
    if (!service) {
      const appContext = await NestFactory.createApplicationContext(
        TransactionTimeoutLambdaModule,
        {
          abortOnError: true,
        },
      );
      service = appContext.get<TransactionTimeoutService>(
        TransactionTimeoutService,
      );
    }

    return service;
  };
