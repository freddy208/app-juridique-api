import 'dotenv/config'; // Charge .env.e2e si défini via NODE_ENV
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const prisma = new PrismaClient();

beforeAll(async () => {
  // Lancer Docker PostgreSQL si nécessaire
  try {
    execSync('docker-compose up -d postgres', { stdio: 'inherit' });
  } catch (err) {
    console.log('Docker peut déjà être lancé', err);
  }

  // Attendre que la DB soit prête
  let retries = 5;
  while (retries) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await prisma.$connect();
      console.log('Connexion DB réussie');
      break;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      retries -= 1;
      console.log('Attente DB...', retries, 'tentatives restantes');
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
});

afterAll(async () => {
  // Déconnecter Prisma
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  await prisma.$disconnect();

  // Stopper Docker si tu veux nettoyer
  try {
    execSync('docker-compose down', { stdio: 'inherit' });
  } catch (err) {
    console.log('Erreur lors du stop Docker', err);
  }
});
