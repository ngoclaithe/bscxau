import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';

import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Necessary for secure cookies behind Nginx proxy
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api/v1');

  const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(url => url.trim().replace(/^["']|["']$/g, '').replace(/\/$/, ''));

  console.log('[Bootstrap] FRONTEND_URL from env:', process.env.FRONTEND_URL);
  console.log('[Bootstrap] Parsed CORS origins:', frontendUrls);

  app.enableCors({
    origin: frontendUrls,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.use(cookieParser());

  // Debug middleware - log incoming cookies
  app.use((req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;
    if (!url.includes('/health') && !url.includes('hot-update')) {
      console.log(`[Debug] ${req.method} ${url}`);
      console.log(`[Debug] Request Headers:`, {
        'User-Agent': req.headers['user-agent']?.slice(0, 50),
        'Origin': req.headers.origin,
        'Cookie': req.headers.cookie ? '✓ Present' : '✗ Missing',
        'Content-Length': req.headers['content-length']
      });
      console.log(`[Debug] Parsed req.cookies:`, Object.keys(req.cookies).length > 0 ? Object.keys(req.cookies) : '(empty)');
    }
    next();
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
