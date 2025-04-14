import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerDocumentOptions,
  OpenAPIObject,
} from '@nestjs/swagger';

export const configureSwagger = (
  app: INestApplication<NestExpressApplication>,
): { swaggerDocument: OpenAPIObject } => {
  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('WXTM-Bridge API')
    .setVersion('1.0')
    .addBearerAuth({ in: 'header', type: 'http' })
    .build();

  const swaggerOptions: SwaggerDocumentOptions = {
    operationIdFactory: (_controllerKey: string, methodKey: string) =>
      methodKey,
  };

  const document = SwaggerModule.createDocument(app, config, swaggerOptions);

  SwaggerModule.setup('api', app, document);

  return { swaggerDocument: document };
};
