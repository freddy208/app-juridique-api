import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('DIRECT_URL:', process.env.DIRECT_URL);

import { PrismaClient } from '../generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL, // ⚡ Utiliser DIRECT_URL
    },
  },
});

async function main() {
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const admin = await prisma.utilisateur.create({
    data: {
      prenom: 'Jean',
      nom: 'Dupont',
      email: 'kfreddypatient@gmail.com',
      motDePasse: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin créé:', admin);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .finally(async () => {
    await prisma.$disconnect();
  });
