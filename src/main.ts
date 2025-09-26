import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Préfixe global (ex: /api/v1/auth, /api/v1/users)
  app.setGlobalPrefix('api/v1');

  // Validation automatique des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // supprime les champs non attendus
      forbidNonWhitelisted: true, // bloque si champs inconnus
      transform: true, // transforme automatiquement les types (string → number)
    }),
  );

  //  Config Swagger
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const config = new DocumentBuilder()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    .setTitle('API Cabinet Juridique')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    .setDescription('Documentation officielle de l’API du cabinet juridique')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    .setVersion('1.0')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    ) // bouton "Authorize" dans Swagger
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    .build();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const document = SwaggerModule.createDocument(app, config);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true }, // garde le token après refresh page
  });

  // Lancement
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(` Application is running on: http://localhost:${port}/api/v1`);
  console.log(`Swagger docs available at: http://localhost:${port}/docs`);
}

// Gestion propre des erreurs
bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
