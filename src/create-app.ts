import { NestFactory } from '@nestjs/core';

import { setMiddlewares } from './helpers/setMiddlewares';
import { AppModule } from './app.module';
import { configureSwagger } from './helpers/configureSwagger';
import './sentry/sentry-init';

export async function createApp() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  setMiddlewares(app);
  const { swaggerDocument } = configureSwagger(app);
  app.enableCors();

  return { app, swaggerDocument };
}
