import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
// Gérer toutes les erreurs de démarrage proprement
bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1); // quitte le process si erreur
});
