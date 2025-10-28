import { ValidationPipe } from '@nestjs/common';
import { createApp } from './create-app';
import { generateSwaggerJsonFile } from './helpers/generateSwaggerJsonFile';

export async function bootstrap() {
  const { app, swaggerDocument } = await createApp();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  generateSwaggerJsonFile(swaggerDocument);

  await app.listen(3000);
}

bootstrap();
