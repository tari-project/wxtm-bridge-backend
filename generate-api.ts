import { generate } from 'openapi-typescript-codegen';

generate({
  input: './swagger.json',
  output: './wxtm-bridge-backend-api/api',
});
