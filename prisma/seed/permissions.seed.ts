import { PrismaClient, RoleUtilisateur } from '@prisma/client';

export async function permissionsSeed(prisma: PrismaClient) {
  console.log('Création des permissions...');

  const modules = [
    'utilisateurs',
    'clients',
    'dossiers',
    'documents',
    'calendrier',
    'taches',
    'factures',
    'paiements',
    'rapports',
    'parametres',
  ];

  const roles = Object.values(RoleUtilisateur);

  const rolePermissions = {
    [RoleUtilisateur.ADMIN]: {
      lecture: true,
      ecriture: true,
      suppression: true,
    },
    [RoleUtilisateur.DG]: { lecture: true, ecriture: true, suppression: true },
    [RoleUtilisateur.AVOCAT]: {
      lecture: true,
      ecriture: true,
      suppression: false,
    },
    [RoleUtilisateur.SECRETAIRE]: {
      lecture: true,
      ecriture: true,
      suppression: false,
    },
    [RoleUtilisateur.ASSISTANT]: {
      lecture: true,
      ecriture: false,
      suppression: false,
    },
    [RoleUtilisateur.JURISTE]: {
      lecture: true,
      ecriture: true,
      suppression: false,
    },
    [RoleUtilisateur.STAGIAIRE]: {
      lecture: true,
      ecriture: false,
      suppression: false,
    },
  };

  for (const role of roles) {
    await Promise.all(
      modules.map((module) =>
        prisma.permissionRole.upsert({
          where: {
            role_module_unique: { role, module }, // clé unique créée dans le modèle
          },
          update: {
            ...rolePermissions[role],
            statut: 'ACTIF',
          },
          create: {
            role,
            module,
            ...rolePermissions[role],
            statut: 'ACTIF',
          },
        }),
      ),
    );
  }

  console.log('Permissions créées ou mises à jour avec succès!');
}
