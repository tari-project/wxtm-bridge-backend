import { Context, APIGatewayProxyEvent, Callback } from 'aws-lambda';
import awsServerlessExpress from '@vendia/serverless-express';

import { createApp } from '../create-app';

let appServer: ReturnType<typeof awsServerlessExpress>;

export const app = async (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback<any>,
) => {
  context.callbackWaitsForEmptyEventLoop = false;
  if (!appServer) {
    const nestApp = await createApp();
    await nestApp.init();
    const app = await nestApp.getHttpAdapter().getInstance();

    appServer = awsServerlessExpress({ app });
  }

  const server = await appServer(event, context, callback);

  return server;
};
