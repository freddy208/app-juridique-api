import { PrismaClient } from '@prisma/client';
import { usersSeed } from './users.seed';
import { permissionsSeed } from './permissions.seed';
import { modelesDocumentsSeed } from './modeles-documents.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Début du seeding de la base de données...');

  // Nettoyage de la base de données
  await cleanDatabase();

  // Création des utilisateurs
  await usersSeed(prisma);

  // Création des permissions
  await permissionsSeed(prisma);

  // Création des modèles de documents
  await modelesDocumentsSeed(prisma);

  console.log('Seeding terminé avec succès!');
}

async function cleanDatabase() {
  await prisma.mouvementProvision.deleteMany();
  await prisma.provision.deleteMany();
  await prisma.paiement.deleteMany();
  await prisma.honoraire.deleteMany();
  await prisma.dossierJurisprudence.deleteMany();
  await prisma.jurisprudence.deleteMany();
  await prisma.documentGenere.deleteMany();
  await prisma.document.deleteMany();
  await prisma.tache.deleteMany();
  await prisma.commentaire.deleteMany();
  await prisma.messageChat.deleteMany();
  await prisma.reactionMessage.deleteMany();
  await prisma.evenementCalendrier.deleteMany();
  await prisma.note.deleteMany();
  await prisma.correspondance.deleteMany();
  await prisma.archive.deleteMany();
  await prisma.permissionRole.deleteMany();
  await prisma.utilisateur.deleteMany();
  await prisma.client.deleteMany();
  await prisma.dossier.deleteMany();
  await prisma.modeleDocument.deleteMany();
  await prisma.parametre.deleteMany();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
