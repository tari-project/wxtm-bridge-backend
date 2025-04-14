import fs from 'fs';
import { OpenAPIObject } from '@nestjs/swagger';

export const generateSwaggerJsonFile = (swaggerDocument: OpenAPIObject) => {
  fs.writeFileSync('swagger.json', JSON.stringify(swaggerDocument, null, 2), {
    encoding: 'utf8',
  });
};
