import { generate, HttpClient } from 'openapi-typescript-codegen';

generate({
  input: './swagger.json',
  output: './wxtm-bridge-backend-api-node/api',
  httpClient: HttpClient.NODE,
  clientName: 'WXTMBridge',
});
