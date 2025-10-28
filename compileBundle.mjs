import * as esbuild from 'esbuild';
import esbuildPluginTsc from 'esbuild-plugin-tsc';
import { sentryEsbuildPlugin } from '@sentry/esbuild-plugin';

const uploadSourceMapToSentry = () => {
  if (!process.env.SENTRY_AUTH_TOKEN) {
    throw new Error('SENTRY_AUTH_TOKEN is not provided!');
  }
  return [
    sentryEsbuildPlugin({
      org: 'tari-labs',
      project: 'wxtm-bridge-backend',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ];
};

await esbuild.build({
  entryPoints: ['src/lambdas/app.ts'],
  bundle: true,
  sourcemap: true,
  minify: false,
  platform: 'node',
  target: 'node22',
  outdir: 'out/app',
  plugins: [esbuildPluginTsc(), ...uploadSourceMapToSentry()],
  external: [
    '@aws-sdk/*',
    '@nestjs/websockets/socket-module',
    '@nestjs/microservices',
    'class-transformer/storage',
    'swagger-ui-dist',
    'app-root-path',
  ],
});

await esbuild.build({
  entryPoints: ['src/lambdas/migrations.ts'],
  bundle: true,
  sourcemap: true,
  minify: false,
  platform: 'node',
  target: 'node22',
  outdir: 'out/migrations',
  plugins: [esbuildPluginTsc()],
  external: [
    '@aws-sdk/*',
    '@nestjs/websockets/socket-module',
    '@nestjs/microservices',
    'class-transformer/storage',
    'swagger-ui-dist',
    'app-root-path',
  ],
});

await esbuild.build({
  entryPoints: ['src/lambdas/subgraph.ts'],
  bundle: true,
  sourcemap: true,
  minify: false,
  platform: 'node',
  target: 'node22',
  outdir: 'out/subgraph',
  plugins: [esbuildPluginTsc()],
  external: [
    '@aws-sdk/*',
    '@nestjs/websockets/socket-module',
    '@nestjs/microservices',
    'class-transformer/storage',
    'swagger-ui-dist',
    'app-root-path',
  ],
});

await esbuild.build({
  entryPoints: ['src/lambdas/timeout.ts'],
  bundle: true,
  sourcemap: true,
  minify: false,
  platform: 'node',
  target: 'node22',
  outdir: 'out/timeout',
  plugins: [esbuildPluginTsc()],
  external: [
    '@aws-sdk/*',
    '@nestjs/websockets/socket-module',
    '@nestjs/microservices',
    'class-transformer/storage',
    'swagger-ui-dist',
    'app-root-path',
  ],
});

await esbuild.build({
  entryPoints: ['src/lambdas/notifications.ts'],
  bundle: true,
  sourcemap: true,
  minify: false,
  platform: 'node',
  target: 'node22',
  outdir: 'out/notifications',
  plugins: [esbuildPluginTsc()],
  external: [
    '@aws-sdk/*',
    '@nestjs/websockets/socket-module',
    '@nestjs/microservices',
    'class-transformer/storage',
    'swagger-ui-dist',
    'app-root-path',
  ],
});
