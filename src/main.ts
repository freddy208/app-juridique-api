import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response } from 'express'; // Importer les types Request et Response

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Utiliser la méthode NestJS pour servir des fichiers statiques
  app.useStaticAssets(join(__dirname, '..', 'exports'), {
    prefix: '/exports/',
  });

  // ⚡ Configurer CORS correctement
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://app-juridique-frontend.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Préfixe global
  app.setGlobalPrefix('api/v1');

  // Validation automatique des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('API Cabinet Juridique')
    .setDescription("Documentation officielle de l'API")
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Rediriger `/` vers `/docs` avec typage correct
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/', (req: Request, res: Response) => {
    res.redirect('/docs');
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API running: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/docs`);
}

bootstrap().catch((err: Error) => {
  // Typage correct pour l'erreur
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
