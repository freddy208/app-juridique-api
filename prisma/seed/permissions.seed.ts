/* eslint-disable prettier/prettier */
import { PrismaClient, RoleUtilisateur, StatutPermission } from '@prisma/client';

const prisma = new PrismaClient();

async function permissionsSeed() {
  console.log('\n🔐 Initialisation des permissions...');

  try {
    // Test de connexion à la base de données
    await prisma.$connect();
    console.log('✅ Connexion à la base de données établie');

    const modules = [
      'UTILISATEURS',
      'CLIENTS',
      'DOSSIERS',
      'DOCUMENTS',
      'EVENEMENTS',
      'TACHES',
      'FACTURES',
      'PAIEMENTS',
      'RAPPORTS',
      'PARAMETRES',
      'NOTES',
      'CORRESPONDANCES',
      'COMMENTAIRES',
      'DEPENSES',
      'HONORAIRES',
      'JURISPRUDENCE',
      'MESSAGERIE',
      'USERS',
      'PROCEDURES',
      'PROVISIONS',
      'DASHBOARD',
      'STATISTIQUES',
      'NOTIFICATIONS',
      'ARCHIVE',
      'PARAMETRES_SYSTEME',
    ];

    const roles = Object.values(RoleUtilisateur);

    const rolePermissions: Record<
      RoleUtilisateur,
      { lecture: boolean; ecriture: boolean; suppression: boolean }
    > = {
      [RoleUtilisateur.ADMIN]: { lecture: true, ecriture: true, suppression: true },
      [RoleUtilisateur.DG]: { lecture: true, ecriture: true, suppression: true },
      [RoleUtilisateur.AVOCAT]: { lecture: true, ecriture: true, suppression: false },
      [RoleUtilisateur.SECRETAIRE]: { lecture: true, ecriture: true, suppression: false },
      [RoleUtilisateur.ASSISTANT]: { lecture: true, ecriture: false, suppression: false },
      [RoleUtilisateur.JURISTE]: { lecture: true, ecriture: true, suppression: false },
      [RoleUtilisateur.STAGIAIRE]: { lecture: true, ecriture: false, suppression: false },
    };

    for (const role of roles) {
      console.log(`🧩 Configuration des permissions pour le rôle: ${role}`);

      for (const module of modules) {
        const perms = rolePermissions[role];

        await prisma.permissionRole.upsert({
          where: { 
            role_module_unique: { role, module } 
          },
          update: {
            lecture: perms.lecture,
            ecriture: perms.ecriture,
            suppression: perms.suppression,
            statut: StatutPermission.ACTIF,
          },
          create: {
            role,
            module,
            lecture: perms.lecture,
            ecriture: perms.ecriture,
            suppression: perms.suppression,
            statut: StatutPermission.ACTIF,
          },
        });
      }
    }

    console.log('\n✅ Permissions initialisées avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors du seed des permissions:', error);
    throw error;
  }
}

permissionsSeed()
  .catch((e) => {
    console.error('❌ Erreur lors du seed des permissions:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });