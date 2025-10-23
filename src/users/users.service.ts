import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
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
import { RoleUtilisateur, StatutUtilisateur } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, motDePasse, ...userData } = createUserDto;

    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { email },
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
        email,
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

    // Construire les filtres
    const where: any = {};

    if (role) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.role = role;
    }

    if (statut) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.statut = statut;
    }

    if (specialite) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.specialite = {
        contains: specialite,
        mode: 'insensitive',
      };
    }

    if (barreau) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.barreau = {
        contains: barreau,
        mode: 'insensitive',
      };
    }

    if (search) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
        },
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.utilisateur.findUnique({
      where: { email },
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { motDePasse, ...userData } = updateUserDto;

    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await this.prisma.utilisateur.findUnique({
        where: { email: userData.email },
      });

      if (emailExists) {
        throw new ConflictException(
          'Un utilisateur avec cet email existe déjà',
        );
      }
    }

    // Préparer les données à mettre à jour
    const updateData: any = { ...userData };

    // Si un nouveau mot de passe est fourni, le hasher
    if (motDePasse) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.motDePasse = await bcrypt.hash(motDePasse, 10);
    }

    // Mettre à jour l'utilisateur
    return await this.prisma.utilisateur.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
      },
    });
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const { motDePasse, ...userData } = updateProfileDto;

    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await this.prisma.utilisateur.findUnique({
        where: { email: userData.email },
      });

      if (emailExists) {
        throw new ConflictException(
          'Un utilisateur avec cet email existe déjà',
        );
      }
    }

    // Préparer les données à mettre à jour
    const updateData: any = { ...userData };

    // Si un nouveau mot de passe est fourni, le hasher
    if (motDePasse) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.motDePasse = await bcrypt.hash(motDePasse, 10);
    }

    // Mettre à jour l'utilisateur
    return await this.prisma.utilisateur.update({
      where: { id: userId },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
      },
    });
  }

  async changeStatus(id: string, changeStatusDto: ChangeStatusDto) {
    const { statut, raison } = changeStatusDto;

    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Mettre à jour le statut de l'utilisateur
    const updatedUser = await this.prisma.utilisateur.update({
      where: { id },
      data: { statut },
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

    // Enregistrer l'action dans le journal d'audit
    await this.prisma.journalAudit.create({
      data: {
        utilisateurId: id,
        action: 'CHANGE_STATUS',
        typeCible: 'UTILISATEUR',
        cibleId: id,
        ancienneValeur: { statut: existingUser.statut },
        nouvelleValeur: { statut, raison },
      },
    });

    return updatedUser;
  }

  async remove(id: string) {
    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Supprimer l'utilisateur
    await this.prisma.utilisateur.delete({
      where: { id },
    });

    return { message: 'Utilisateur supprimé avec succès' };
  }

  async bulkAction(bulkActionDto: BulkActionDto) {
    const { userIds, action, role, statut, raison } = bulkActionDto;

    // Vérifier si tous les utilisateurs existent
    const existingUsers = await this.prisma.utilisateur.findMany({
      where: { id: { in: userIds } },
    });

    if (existingUsers.length !== userIds.length) {
      throw new NotFoundException('Un ou plusieurs utilisateurs non trouvés');
    }

    let result;

    switch (action) {
      case 'changeRole':
        if (!role) {
          throw new BadRequestException('Le rôle est requis pour cette action');
        }

        // Mettre à jour le rôle des utilisateurs
        result = await this.prisma.utilisateur.updateMany({
          where: { id: { in: userIds } },
          data: { role },
        });

        // Enregistrer l'action dans le journal d'audit pour chaque utilisateur
        for (const userId of userIds) {
          await this.prisma.journalAudit.create({
            data: {
              utilisateurId: userId,
              action: 'BULK_CHANGE_ROLE',
              typeCible: 'UTILISATEUR',
              cibleId: userId,
              nouvelleValeur: { role },
            },
          });
        }

        return {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          message: `${result.count} utilisateurs mis à jour avec le rôle ${role}`,
        };

      case 'changeStatus':
        if (!statut) {
          throw new BadRequestException(
            'Le statut est requis pour cette action',
          );
        }

        // Mettre à jour le statut des utilisateurs
        result = await this.prisma.utilisateur.updateMany({
          where: { id: { in: userIds } },
          data: { statut },
        });

        // Enregistrer l'action dans le journal d'audit pour chaque utilisateur
        for (const userId of userIds) {
          await this.prisma.journalAudit.create({
            data: {
              utilisateurId: userId,
              action: 'BULK_CHANGE_STATUS',
              typeCible: 'UTILISATEUR',
              cibleId: userId,
              nouvelleValeur: { statut, raison },
            },
          });
        }

        return {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          message: `${result.count} utilisateurs mis à jour avec le statut ${statut}`,
        };

      case 'delete':
        // Supprimer les utilisateurs
        result = await this.prisma.utilisateur.deleteMany({
          where: { id: { in: userIds } },
        });

        return {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          message: `${result.count} utilisateurs supprimés avec succès`,
        };

      default:
        throw new BadRequestException('Action non valide');
    }
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

    // Obtenir l'activité récente (création d'utilisateurs par mois)
    const recentActivity = await this.prisma.$queryRawUnsafe<
      { date: Date; count: bigint }[]
    >(`
      SELECT 
        DATE_TRUNC('month', "creeLe") as date,
        COUNT(*) as count
      FROM "Utilisateur"
      WHERE "creeLe" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "creeLe")
      ORDER BY date DESC
    `);

    // Formater les données
    const total = statsByStatus.reduce(
      (sum, stat) => sum + stat._count.statut,
      0,
    );
    const actifs =
      statsByStatus.find((stat) => stat.statut === 'ACTIF')?._count.statut || 0;
    const inactifs =
      statsByStatus.find((stat) => stat.statut === 'INACTIF')?._count.statut ||
      0;
    const suspendus =
      statsByStatus.find((stat) => stat.statut === 'SUSPENDU')?._count.statut ||
      0;

    const parRole = statsByRole.reduce(
      (acc, stat) => {
        acc[stat.role] = stat._count.role;
        return acc;
      },
      {} as Record<string, number>,
    );

    const formattedActivity = recentActivity.map((activity) => ({
      date: new Date(activity.date).toISOString().split('T')[0],
      count: Number(activity.count),
    }));

    return {
      total,
      actifs,
      inactifs,
      suspendus,
      parRole,
      recentActivity: formattedActivity,
    };
  }

  async getPerformance(): Promise<UserPerformance[]> {
    // Obtenir les performances des avocats
    const performances = await this.prisma.utilisateur.findMany({
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
        _count: {
          select: {
            dossiers: true,
          },
        },
      },
    });

    // Pour chaque avocat, calculer les métriques de performance
    return await Promise.all(
      performances.map(async (user) => {
        // Obtenir le nombre de dossiers terminés
        const dossiersTermines = await this.prisma.dossier.count({
          where: {
            responsableId: user.id,
            statut: 'CLOS',
          },
        });

        // Obtenir le chiffre d'affaires
        const honoraires = await this.prisma.honoraire.aggregate({
          where: {
            dossier: {
              responsableId: user.id,
            },
          },
          _sum: {
            montantTTC: true,
          },
        });

        // Obtenir la satisfaction moyenne
        const satisfactions = await this.prisma.satisfaction.aggregate({
          where: {
            dossier: {
              responsableId: user.id,
            },
          },
          _avg: {
            note: true,
          },
        });

        // Obtenir le délai moyen de traitement
        // Obtenir le délai moyen de traitement
        const delaisMoyens = await this.prisma.$queryRaw<
          { delaiMoyen: number }[]
        >`
          SELECT 
            AVG(EXTRACT(EPOCH FROM ("modifieLe" - "creeLe")) / 86400) as "delaiMoyen"
          FROM "Dossier"
          WHERE "responsableId" = ${user.id}
          AND "statut" = 'CLOS'
        `;

        const tauxCompletion =
          user._count.dossiers > 0
            ? (dossiersTermines / user._count.dossiers) * 100
            : 0;
        return {
          userId: user.id,
          nomComplet: `${user.prenom} ${user.nom}`,
          role: user.role,
          nombreDossiers: user._count.dossiers,
          dossiersTermines,
          tauxCompletion,
          chiffreAffaires: honoraires._sum.montantTTC
            ? honoraires._sum.montantTTC.toNumber()
            : 0,
          satisfactionMoyenne: satisfactions._avg.note || 0,
          delaiMoyenTraitement: delaisMoyens[0]?.delaiMoyen || 0,
        };
      }),
    );
  }

  async search(query: string) {
    // sourcery skip: inline-immediately-returned-variable
    const users = await this.prisma.utilisateur.findMany({
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
      take: 10, // Limiter les résultats pour la recherche rapide
    });

    return users;
  }

  getAvailableRoles() {
    return Object.values(RoleUtilisateur);
  }

  getAvailableStatuses() {
    return Object.values(StatutUtilisateur);
  }
}
