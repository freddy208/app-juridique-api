import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { BulkActionDto } from './dto/bulk-action.dto';
import { UserStats } from './interfaces/user-stats.interface';
import { UserPerformance } from './interfaces/user-performance.interface';
import { PaginationParams } from '../common/interfaces/pagination.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import * as bcrypt from 'bcryptjs';
import { RoleUtilisateur, StatutUtilisateur, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, motDePasse, ...userData } = createUserDto;

    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Créer l'utilisateur
    return await this.prisma.utilisateur.create({
      data: {
        ...userData,
        email: email.toLowerCase(),
        motDePasse: hashedPassword,
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
        statut: true,
        telephone: true,
        adresse: true,
        specialite: true,
        barreau: true,
        numeroPermis: true,
        creeLe: true,
        modifieLe: true,
      },
    });
  }

  async findAll(params: PaginationParams & FilterUsersDto) {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      role,
      statut,
      search,
      specialite,
      barreau,
    } = params;

    const { skip, take, orderBy } = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // ✅ CORRECTION: Typage strict Prisma
    const where: Prisma.UtilisateurWhereInput = {
      statut: statut ?? StatutUtilisateur.ACTIF,
    };

    if (role) {
      where.role = role;
    }

    if (statut) {
      where.statut = statut;
    }

    if (specialite) {
      where.specialite = {
        contains: specialite,
        mode: 'insensitive',
      };
    }

    if (barreau) {
      where.barreau = {
        contains: barreau,
        mode: 'insensitive',
      };
    }

    if (search) {
      where.OR = [
        { prenom: { contains: search, mode: 'insensitive' } },
        { nom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Exécuter la requête avec pagination
    const [users, total] = await Promise.all([
      this.prisma.utilisateur.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          prenom: true,
          nom: true,
          email: true,
          role: true,
          statut: true,
          telephone: true,
          adresse: true,
          specialite: true,
          barreau: true,
          numeroPermis: true,
          creeLe: true,
          modifieLe: true,
          derniereConnexion: true,
        },
      }),
      this.prisma.utilisateur.count({ where }),
    ]);

    return PaginationUtil.createPaginationResult(users, total, {
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
        statut: true,
        telephone: true,
        adresse: true,
        specialite: true,
        barreau: true,
        numeroPermis: true,
        creeLe: true,
        modifieLe: true,
        derniereConnexion: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.utilisateur.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
        statut: true,
        telephone: true,
        adresse: true,
        specialite: true,
        barreau: true,
        numeroPermis: true,
        creeLe: true,
        modifieLe: true,
        derniereConnexion: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { motDePasse, email, ...userData } = updateUserDto;

    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (email && email.toLowerCase() !== existingUser.email) {
      const emailExists = await this.prisma.utilisateur.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (emailExists) {
        throw new ConflictException(
          'Un utilisateur avec cet email existe déjà',
        );
      }
    }

    // ✅ CORRECTION: Typage strict Prisma
    const updateData: Prisma.UtilisateurUpdateInput = {
      ...userData,
      ...(email && { email: email.toLowerCase() }),
    };

    // Si un nouveau mot de passe est fourni, le hasher
    if (motDePasse) {
      updateData.motDePasse = await bcrypt.hash(motDePasse, 10);
    }

    // Mettre à jour l'utilisateur
    return await this.prisma.utilisateur.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
        statut: true,
        telephone: true,
        adresse: true,
        specialite: true,
        barreau: true,
        numeroPermis: true,
        creeLe: true,
        modifieLe: true,
        derniereConnexion: true,
      },
    });
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const { ancienMotDePasse, nouveauMotDePasse, email, ...userData } =
      updateProfileDto;

    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        motDePasse: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // ✅ AMÉLIORATION: Validation du mot de passe actuel
    if (nouveauMotDePasse) {
      if (!ancienMotDePasse) {
        throw new BadRequestException(
          "L'ancien mot de passe est requis pour en définir un nouveau",
        );
      }

      const isPasswordValid = await bcrypt.compare(
        ancienMotDePasse,
        existingUser.motDePasse,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Ancien mot de passe incorrect');
      }
    }

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (email && email.toLowerCase() !== existingUser.email) {
      const emailExists = await this.prisma.utilisateur.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (emailExists) {
        throw new ConflictException(
          'Un utilisateur avec cet email existe déjà',
        );
      }
    }

    // Préparer les données à mettre à jour
    const updateData: Prisma.UtilisateurUpdateInput = {
      ...userData,
      ...(email && { email: email.toLowerCase() }),
    };

    // Si un nouveau mot de passe est fourni, le hasher
    if (nouveauMotDePasse) {
      updateData.motDePasse = await bcrypt.hash(nouveauMotDePasse, 10);
    }

    // Mettre à jour le profil
    return await this.prisma.utilisateur.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
        statut: true,
        telephone: true,
        adresse: true,
        specialite: true,
        barreau: true,
        numeroPermis: true,
        creeLe: true,
        modifieLe: true,
        derniereConnexion: true,
      },
    });
  }

  async changeStatus(id: string, changeStatusDto: ChangeStatusDto) {
    const { statut, raison } = changeStatusDto;

    const user = await this.prisma.utilisateur.findUnique({
      where: { id },
      include: {
        dossiers: {
          where: { statut: { in: ['OUVERT', 'EN_COURS'] } },
          select: { id: true, numeroUnique: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // ✅ AMÉLIORATION: Règles métier
    if (
      statut === StatutUtilisateur.SUSPENDU ||
      statut === StatutUtilisateur.INACTIF
    ) {
      // Vérifier si dernier admin
      if (user.role === RoleUtilisateur.ADMIN) {
        const activeAdmins = await this.prisma.utilisateur.count({
          where: {
            role: RoleUtilisateur.ADMIN,
            statut: StatutUtilisateur.ACTIF,
            id: { not: id },
          },
        });

        if (activeAdmins === 0) {
          throw new BadRequestException(
            'Impossible de désactiver le dernier administrateur actif',
          );
        }
      }

      // Avertir des dossiers actifs
      if (user.dossiers.length > 0) {
        throw new BadRequestException(
          `L'utilisateur a ${user.dossiers.length} dossier(s) actif(s). ` +
            `Veuillez les réassigner avant de changer le statut.`,
        );
      }
    }

    // ✅ AMÉLIORATION: Transaction pour atomicité
    return await this.prisma.$transaction(async (tx) => {
      // Mettre à jour le statut
      const updatedUser = await tx.utilisateur.update({
        where: { id },
        data: { statut },
        select: {
          id: true,
          prenom: true,
          nom: true,
          email: true,
          role: true,
          statut: true,
        },
      });

      // Logger l'action
      await tx.journalAudit.create({
        data: {
          utilisateurId: id,
          action: 'CHANGE_STATUS',
          typeCible: 'UTILISATEUR',
          cibleId: id,
          ancienneValeur: { statut: user.statut },
          nouvelleValeur: { statut, raison },
        },
      });

      return updatedUser;
    });
  }

  async remove(id: string) {
    // ✅ AMÉLIORATION: Soft delete avec vérifications
    const user = await this.prisma.utilisateur.findUnique({
      where: { id },
      include: {
        dossiers: { where: { statut: { not: 'CLOS' } } },
        tachesAssignees: { where: { statut: { not: 'TERMINEE' } } },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier si dernier admin
    if (user.role === RoleUtilisateur.ADMIN) {
      const activeAdmins = await this.prisma.utilisateur.count({
        where: {
          role: RoleUtilisateur.ADMIN,
          statut: StatutUtilisateur.ACTIF,
          id: { not: id },
        },
      });

      if (activeAdmins === 0) {
        throw new BadRequestException(
          'Impossible de supprimer le dernier administrateur actif',
        );
      }
    }

    // Vérifier les dépendances actives
    if (user.dossiers.length > 0) {
      throw new BadRequestException(
        `Impossible de supprimer: ${user.dossiers.length} dossier(s) actif(s). ` +
          `Veuillez les réassigner ou les clôturer avant.`,
      );
    }

    if (user.tachesAssignees.length > 0) {
      throw new BadRequestException(
        `Impossible de supprimer: ${user.tachesAssignees.length} tâche(s) en cours. ` +
          `Veuillez les réassigner ou les terminer avant.`,
      );
    }

    // Soft delete avec transaction
    return await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.utilisateur.update({
        where: { id },
        data: {
          statut: StatutUtilisateur.INACTIF,
          email: `deleted_${Date.now()}_${user.email}`, // Libérer l'email
        },
        select: {
          id: true,
          prenom: true,
          nom: true,
          email: true,
          statut: true,
        },
      });

      // Logger
      await tx.journalAudit.create({
        data: {
          utilisateurId: id,
          action: 'DELETE_USER',
          typeCible: 'UTILISATEUR',
          cibleId: id,
          ancienneValeur: {
            statut: user.statut,
            email: user.email,
          },
          nouvelleValeur: {
            statut: StatutUtilisateur.INACTIF,
            email: deleted.email,
          },
        },
      });

      return { message: 'Utilisateur supprimé avec succès', user: deleted };
    });
  }

  async bulkAction(bulkActionDto: BulkActionDto) {
    const { userIds, action, role, statut, raison } = bulkActionDto;

    // ✅ AMÉLIORATION: Transaction pour atomicité
    return await this.prisma.$transaction(async (tx) => {
      // Vérifier si tous les utilisateurs existent
      const existingUsers = await tx.utilisateur.findMany({
        where: { id: { in: userIds } },
      });

      if (existingUsers.length !== userIds.length) {
        throw new NotFoundException('Un ou plusieurs utilisateurs non trouvés');
      }

      let result;

      switch (action) {
        case 'changeRole':
          if (!role) {
            throw new BadRequestException(
              'Le rôle est requis pour cette action',
            );
          }

          // Mettre à jour le rôle des utilisateurs
          result = await tx.utilisateur.updateMany({
            where: { id: { in: userIds } },
            data: { role },
          });

          // ✅ AMÉLIORATION: Audit en batch
          await tx.journalAudit.createMany({
            data: userIds.map((userId) => ({
              utilisateurId: userId,
              action: 'BULK_CHANGE_ROLE',
              typeCible: 'UTILISATEUR',
              cibleId: userId,
              nouvelleValeur: { role },
            })),
          });

          return {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            message: `${result.count} utilisateur(s) mis à jour avec le rôle ${role}`,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            count: result.count,
          };

        case 'changeStatus':
          if (!statut) {
            throw new BadRequestException(
              'Le statut est requis pour cette action',
            );
          }

          result = await tx.utilisateur.updateMany({
            where: { id: { in: userIds } },
            data: { statut },
          });

          // Audit en batch
          await tx.journalAudit.createMany({
            data: userIds.map((userId) => ({
              utilisateurId: userId,
              action: 'BULK_CHANGE_STATUS',
              typeCible: 'UTILISATEUR',
              cibleId: userId,
              nouvelleValeur: { statut, raison },
            })),
          });

          return {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            message: `${result.count} utilisateur(s) mis à jour avec le statut ${statut}`,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            count: result.count,
          };

        case 'delete':
          // Vérifier les dépendances pour chaque utilisateur
          for (const userId of userIds) {
            const user = await tx.utilisateur.findUnique({
              where: { id: userId },
              include: {
                dossiers: { where: { statut: { not: 'CLOS' } } },
              },
            });

            // ✅ Correction : vérifier que dossiers existe et a une longueur
            if (user?.dossiers && user.dossiers.length > 0) {
              throw new BadRequestException(
                `Impossible de supprimer l'utilisateur ${user.prenom} ${user.nom}: ` +
                  `${user.dossiers.length} dossier(s) actif(s)`,
              );
            }
          }

          // Soft delete en masse
          result = await tx.utilisateur.updateMany({
            where: { id: { in: userIds } },
            data: { statut: StatutUtilisateur.INACTIF },
          });

          return {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            message: `${result.count} utilisateur(s) supprimé(s) avec succès`,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            count: result.count,
          };

        default:
          throw new BadRequestException('Action non valide');
      }
    });
  }

  async getStats(): Promise<UserStats> {
    // Obtenir le nombre total d'utilisateurs par statut
    const statsByStatus = await this.prisma.utilisateur.groupBy({
      by: ['statut'],
      _count: {
        statut: true,
      },
    });

    // Obtenir le nombre total d'utilisateurs par rôle
    const statsByRole = await this.prisma.utilisateur.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    });

    // ✅ AMÉLIORATION: Requête ORM au lieu de SQL brut
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentUsers = await this.prisma.utilisateur.findMany({
      where: {
        creeLe: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        creeLe: true,
      },
    });

    // Grouper par mois en JavaScript
    const activityMap = new Map<string, number>();
    recentUsers.forEach((user) => {
      const monthKey = user.creeLe.toISOString().slice(0, 7); // YYYY-MM
      activityMap.set(monthKey, (activityMap.get(monthKey) || 0) + 1);
    });

    const formattedActivity = Array.from(activityMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // Formater les données
    const total = statsByStatus.reduce(
      (sum, stat) => sum + stat._count.statut,
      0,
    );
    const actifs =
      statsByStatus.find((stat) => stat.statut === StatutUtilisateur.ACTIF)
        ?._count?.statut || 0;
    const inactifs =
      statsByStatus.find((stat) => stat.statut === StatutUtilisateur.INACTIF)
        ?._count?.statut || 0;
    const suspendus =
      statsByStatus.find((stat) => stat.statut === StatutUtilisateur.SUSPENDU)
        ?._count?.statut || 0;

    const parRole = statsByRole.reduce(
      (acc, stat) => {
        acc[stat.role] = stat._count.role;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total,
      actifs,
      inactifs,
      suspendus,
      parRole,
      recentActivity: formattedActivity,
    };
  }

  // Version corrigée de la méthode getPerformance()

  async getPerformance(): Promise<UserPerformance[]> {
    // ✅ CORRECTION MAJEURE: Optimisation requêtes N+1
    const avocats = await this.prisma.utilisateur.findMany({
      where: {
        role: {
          in: [RoleUtilisateur.AVOCAT, RoleUtilisateur.DG],
        },
        statut: StatutUtilisateur.ACTIF,
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        role: true,
      },
    });

    const avocatIds = avocats.map((a) => a.id);

    if (avocatIds.length === 0) {
      return [];
    }

    // ✅ Une seule requête groupée pour tous les dossiers
    const dossierStats = await this.prisma.dossier.groupBy({
      by: ['responsableId'],
      where: { responsableId: { in: avocatIds } },
      _count: { id: true },
    });

    // ✅ Dossiers terminés en une requête
    const dossiersClos = await this.prisma.dossier.groupBy({
      by: ['responsableId'],
      where: {
        responsableId: { in: avocatIds },
        statut: 'CLOS',
      },
      _count: { id: true },
    });

    // ✅ HONORAIRES - Correction complète
    const honoraires = await this.prisma.honoraire.groupBy({
      by: ['dossierId'],
      where: {
        dossier: {
          responsableId: { in: avocatIds },
        },
      },
      _sum: {
        montantTTC: true,
      },
    });

    // Récupérer les dossiers pour les honoraires
    const dossierIdsForHonoraires = honoraires
      .map((h) => h.dossierId)
      .filter((id): id is string => id != null);
    const dossiersForHonoraires = await this.prisma.dossier.findMany({
      where: { id: { in: dossierIdsForHonoraires } },
      select: { id: true, responsableId: true },
    });

    const dossierMapForHonoraires = new Map(
      dossiersForHonoraires.map((d) => [d.id, d.responsableId]),
    );

    // Construire la map des honoraires par responsableId
    const honorairesMap = new Map<string, number>();
    for (const h of honoraires) {
      const responsableId = h.dossierId
        ? dossierMapForHonoraires.get(h.dossierId)
        : null;
      if (responsableId && h._sum?.montantTTC) {
        const current = honorairesMap.get(responsableId) || 0;
        honorairesMap.set(
          responsableId,
          current + h._sum.montantTTC.toNumber(),
        );
      }
    }

    // ✅ SATISFACTION - Correction complète
    const satisfactions = await this.prisma.satisfaction.groupBy({
      by: ['dossierId'],
      where: {
        dossier: {
          responsableId: { in: avocatIds },
        },
      },
      _avg: {
        note: true,
      },
    });

    // Récupérer tous les dossierId uniques pour satisfaction
    const dossierIdsForSatisfaction = satisfactions
      .map((s) => s.dossierId)
      .filter((id): id is string => id != null);

    // Récupérer tous les dossiers en une seule requête
    const dossiersForSatisfaction = await this.prisma.dossier.findMany({
      where: { id: { in: dossierIdsForSatisfaction } },
      select: { id: true, responsableId: true },
    });

    // Créer une map pour un accès rapide
    const dossierMapForSatisfaction = new Map(
      dossiersForSatisfaction.map((d) => [d.id, d.responsableId]),
    );

    // Construire la satisfaction map
    const satisfactionMap = new Map<string, number[]>();
    for (const s of satisfactions) {
      const responsableId = s.dossierId
        ? dossierMapForSatisfaction.get(s.dossierId)
        : null;
      if (responsableId && s._avg?.note != null) {
        if (!satisfactionMap.has(responsableId)) {
          satisfactionMap.set(responsableId, []);
        }
        satisfactionMap.get(responsableId)!.push(s._avg.note);
      }
    }

    // ✅ DÉLAIS - Requête SQL optimisée avec paramètres bindés
    const delaisStats = await this.prisma.$queryRaw<
      Array<{
        responsableId: string;
        delaiMoyen: number;
      }>
    >`
      SELECT 
        "responsableId",
        AVG(EXTRACT(EPOCH FROM ("modifieLe" - "creeLe")) / 86400) as "delaiMoyen"
      FROM "Dossier"
      WHERE "responsableId" = ANY(${avocatIds}::text[])
        AND "statut" = 'CLOS'
      GROUP BY "responsableId"
    `;

    // ✅ Construire le résultat final
    return avocats.map((avocat) => {
      const dossiersTotal =
        dossierStats.find((s) => s.responsableId === avocat.id)?._count.id || 0;
      const dossiersTermines =
        dossiersClos.find((s) => s.responsableId === avocat.id)?._count.id || 0;
      const tauxCompletion =
        dossiersTotal > 0 ? (dossiersTermines / dossiersTotal) * 100 : 0;

      const satisfactionsAvocat = satisfactionMap.get(avocat.id) || [];
      const satisfactionMoyenne =
        satisfactionsAvocat.length > 0
          ? satisfactionsAvocat.reduce((a, b) => a + b, 0) /
            satisfactionsAvocat.length
          : 0;

      const delaiMoyen =
        delaisStats.find((d) => d.responsableId === avocat.id)?.delaiMoyen || 0;

      return {
        userId: avocat.id,
        nomComplet: `${avocat.prenom} ${avocat.nom}`,
        role: avocat.role,
        nombreDossiers: dossiersTotal,
        dossiersTermines,
        tauxCompletion: Math.round(tauxCompletion * 100) / 100,
        chiffreAffaires: honorairesMap.get(avocat.id) || 0,
        satisfactionMoyenne: Math.round(satisfactionMoyenne * 100) / 100,
        delaiMoyenTraitement: Math.round(delaiMoyen * 100) / 100,
      };
    });
  }

  async search(query: string, limit: number = 10) {
    // ✅ AMÉLIORATION: Validation de la limite
    if (!query || query.trim().length < 2) {
      throw new BadRequestException(
        'La recherche doit contenir au moins 2 caractères',
      );
    }

    if (limit > 50) {
      throw new BadRequestException('Limite maximale: 50 résultats');
    }

    return await this.prisma.utilisateur.findMany({
      where: {
        OR: [
          { prenom: { contains: query, mode: 'insensitive' } },
          { nom: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { telephone: { contains: query, mode: 'insensitive' } },
          { specialite: { contains: query, mode: 'insensitive' } },
          { barreau: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
        statut: true,
        telephone: true,
        specialite: true,
        barreau: true,
      },
      take: limit,
    });
  }

  getAvailableRoles() {
    // ✅ AMÉLIORATION: Formater pour l'UI
    return Object.values(RoleUtilisateur).map((role) => ({
      value: role,
      label: role,
    }));
  }

  getAvailableStatuses() {
    // ✅ AMÉLIORATION: Formater pour l'UI
    return Object.values(StatutUtilisateur).map((statut) => ({
      value: statut,
      label: statut,
    }));
  }
}
