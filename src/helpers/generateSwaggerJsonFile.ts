import fs from 'fs';
import { OpenAPIObject } from '@nestjs/swagger';

export const generateSwaggerJsonFile = (swaggerDocument: OpenAPIObject) => {
  if (process.env.ENVIRONMENT !== 'dev') {
    return;
  }

  fs.writeFileSync('swagger.json', JSON.stringify(swaggerDocument, null, 2), {
    encoding: 'utf8',
  });
};
