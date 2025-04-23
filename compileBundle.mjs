import * as esbuild from 'esbuild';
import esbuildPluginTsc from 'esbuild-plugin-tsc';

await esbuild.build({
  entryPoints: ['src/lambdas/app.ts'],
  bundle: true,
  sourcemap: true,
  minify: false,
  platform: 'node',
  target: 'node18',
  outdir: 'out/app',
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
  entryPoints: ['src/lambdas/migrations.ts'],
  bundle: true,
  sourcemap: true,
  minify: false,
  platform: 'node',
  target: 'node18',
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
  target: 'node18',
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
