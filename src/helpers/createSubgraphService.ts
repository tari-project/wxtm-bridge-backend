import { NestFactory } from '@nestjs/core';

import { SubgraphService } from '../subgraph/subgraph.service';
import { SubgraphLambdaModule } from '../subgraph/subgraph-lambda.module';

let service: SubgraphService | undefined;

export const createSubgraphService = async (): Promise<SubgraphService> => {
  if (!service) {
    const appContext = await NestFactory.createApplicationContext(
      SubgraphLambdaModule,
      {
        abortOnError: true,
      },
    );
    service = appContext.get<SubgraphService>(SubgraphService);
  }

  return service;
};
