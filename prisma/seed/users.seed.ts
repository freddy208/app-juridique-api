/*import { PrismaClient, RoleUtilisateur } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function usersSeed(prisma: PrismaClient) {
  console.log('Création des utilisateurs...');

  const defaultPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.utilisateur.create({
    data: {
      prenom: 'Admin',
      nom: 'Système',
      email: 'admin@cabinet237.cm',
      motDePasse: defaultPassword,
      role: RoleUtilisateur.ADMIN,
      statut: 'ACTIF',
    },
  });

  const dgUser = await prisma.utilisateur.create({
    data: {
      prenom: 'Directeur',
      nom: 'Général',
      email: 'dg@cabinet237.cm',
      motDePasse: defaultPassword,
      role: RoleUtilisateur.DG,
      statut: 'ACTIF',
    },
  });

  const avocatUser = await prisma.utilisateur.create({
    data: {
      prenom: 'Maître',
      nom: 'Avocat',
      email: 'avocat@cabinet237.cm',
      motDePasse: defaultPassword,
      role: RoleUtilisateur.AVOCAT,
      statut: 'ACTIF',
    },
  });

  const secretaireUser = await prisma.utilisateur.create({
    data: {
      prenom: 'Secrétaire',
      nom: 'Cabinet',
      email: 'secretaire@cabinet237.cm',
      motDePasse: defaultPassword,
      role: RoleUtilisateur.SECRETAIRE,
      statut: 'ACTIF',
    },
  });

  console.log('Utilisateurs créés avec succès!');
  return { adminUser, dgUser, avocatUser, secretaireUser };
}*/
