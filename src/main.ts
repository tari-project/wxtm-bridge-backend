import { createApp } from './create-app';
import { generateSwaggerJsonFile } from './helpers/generateSwaggerJsonFile';

export async function bootstrap() {
  const { app, swaggerDocument } = await createApp();

  generateSwaggerJsonFile(swaggerDocument);

  await app.listen(3000);
}

bootstrap();
