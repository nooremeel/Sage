import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import serverlessPackage from '@codegenie/serverless-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { Context, Callback, Handler } from 'aws-lambda';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';

const serverlessExpress =
  (serverlessPackage as any).default || (serverlessPackage as any).configure || serverlessPackage;

let cachedServer: Handler;

async function bootstrapServer(): Promise<Handler> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-request-id',
      'x-csrf-token',
      'x-signature',
    ],
    exposedHeaders: ['x-request-id'],
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export default async function handler(
  req: any,
  res: any,
  context?: Context,
  callback?: Callback,
) {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }
  return (cachedServer as any)(req, res, context, callback);
}
