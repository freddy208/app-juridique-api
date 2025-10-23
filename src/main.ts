import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Servir des fichiers statiques
  app.useStaticAssets(join(__dirname, '..', 'exports'), {
    prefix: '/exports/',
  });

  // Configuration de CORS
  app.enableCors({
    origin: [
      'https://app-juridique-frontend.vercel.app',
      'http://localhost:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Préfixe global versionné
  app.setGlobalPrefix('api/v1');

  // Pipes globaux améliorés
  app.useGlobalPipes(new ValidationPipe());

  // Intercepteurs globaux
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Filtres d'exception globaux
  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());

  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cabinet Juridique 237 API')
    .setDescription("Documentation officielle de l'API")
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Rediriger `/` vers `/docs`
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/', (req: Request, res: Response) => {
    res.redirect('/docs');
  });

  // Démarrage de l'application
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const port = configService.get('app.port') ?? process.env.PORT ?? 3000;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  await app.listen(port);
  console.log(`API running: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/docs`);
}

bootstrap().catch((err: Error) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
