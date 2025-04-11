import { NestFactory } from '@nestjs/core';

import { setMiddlewares } from './helpers/setMiddlewares';
import { AppModule } from './app.module';
import { configureSwagger } from './helpers/configureSwagger';

export async function createApp() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  setMiddlewares(app);
  configureSwagger(app);
  app.enableCors();

  return app;
}
