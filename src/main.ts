import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();

  const AUDIO_DIR = join(process.cwd(), 'storage', 'audio');
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  app.useStaticAssets(AUDIO_DIR, {
    prefix: '/audio',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
}

bootstrap();
