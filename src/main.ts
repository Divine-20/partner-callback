import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable CORS for cross-origin requests
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(
    bodyParser.json({
      verify: (req: any, res, buf) => {
        // Save the raw body string (UTF-8) for HMAC verification.
        if (buf && req.url === '/api/v1/job-callback') {
          req.rawBody = buf;
        }
      },
    }),
  );
  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Job Callback API')
    .setDescription('API for receiving job callbacks from partner systems')
    .setVersion('1.0')
    .addTag('Job Callbacks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(
    `📚 Swagger documentation available at: http://localhost:${port}/api/docs`,
  );
  logger.log(
    `🎯 WEBHOOK URL for Partner API: http://localhost:${port}/api/v1/job-callback`,
  );
  logger.log(
    `📊 Callback history: http://localhost:${port}/api/v1/job-callback/history`,
  );
  logger.log(
    `🧪 Test endpoint: http://localhost:${port}/api/v1/job-callback/test`,
  );
  logger.log(`\n🔔 Ready to receive callbacks from G2Sentry Partner API!`);
}

bootstrap();
