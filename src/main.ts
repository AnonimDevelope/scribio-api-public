import * as dotenv from 'dotenv';
dotenv.config();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import config from './config';
import { config as awsConfig } from 'aws-sdk';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: config.frontendUrl, credentials: true });
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser(config.cookieSecret));

  awsConfig.update({
    region: 'eu-central-1',
  });

  await app.listen(config.port);
}
bootstrap();
