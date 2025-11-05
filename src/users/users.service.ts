/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangerPasswordDto } from './dto/change-password.dto';
import {
  UserResponse,
  UserStatsResponse,
} from './interfaces/user-response.interface';
import { RoleUtilisateur, StatutUtilisateur } from '@prisma/client';
import { PaginationUtil } from '../common/utils/pagination.util';
import { QueryUsersDto } from './dto/filter-users.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // -------------------- CRUD DE BASE --------------------
  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
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
    const utilisateur = await this.prisma.utilisateur.create({
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
        telephone: true,
        adresse: true,
        specialite: true,
        barreau: true,
        numeroPermis: true,
        role: true,
        statut: true,
        creeLe: true,
        modifieLe: true,
        derniereConnexion: true,
      },
    });

    // Invalider le cache
    await this.invalidateUsersCache();

    return utilisateur as UserResponse; // Conversion explicite
  }

  async findAll(query: QueryUsersDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'creeLe',
      sortOrder = 'desc',
      role,
      statut,
      search,
    } = query;

    // Clé de cache pour cette requête
    const cacheKey = `users:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Construire les filtres
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (statut) {
      where.statut = statut;
    }

    if (search) {
      where.OR = [
        { prenom: { contains: search, mode: 'insensitive' } },
        { nom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { specialite: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Obtenir les paramètres de pagination
    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Exécuter la requête
    const [utilisateurs, total] = await Promise.all([
      this.prisma.utilisateur.findMany({
        where,
        ...paginationParams,
        select: {
          id: true,
          prenom: true,
          nom: true,
          email: true,
          telephone: true,
          adresse: true,
          specialite: true,
          barreau: true,
          numeroPermis: true,
          role: true,
          statut: true,
          creeLe: true,
          modifieLe: true,
          derniereConnexion: true,
        },
      }),
      this.prisma.utilisateur.count({ where }),
    ]);

    // Formater la réponse
    const result = PaginationUtil.createPaginationResult(utilisateurs, total, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  async findOne(id: string): Promise<UserResponse> {
    const cacheKey = `user:${id}`;
    const cachedUser = await this.cacheManager.get(cacheKey);

    if (cachedUser) {
      return cachedUser as UserResponse; // Conversion explicite
    }

    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        telephone: true,
        adresse: true,
        specialite: true,
        barreau: true,
        numeroPermis: true,
        role: true,
        statut: true,
        creeLe: true,
        modifieLe: true,
        derniereConnexion: true,
      },
    });

    if (!utilisateur) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // Mettre en cache pour 10 minutes
    await this.cacheManager.set(cacheKey, utilisateur, 600);

    return utilisateur as UserResponse; // Conversion explicite
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    const { email, ...userData } = updateUserDto;

    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (email && email !== existingUser.email) {
      const emailExists = await this.prisma.utilisateur.findUnique({
        where: { email },
      });

      if (emailExists) {
        throw new ConflictException(
          'Un utilisateur avec cet email existe déjà',
        );
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await this.prisma.utilisateur.update({
      where: { id },
      data: {
        ...userData,
        ...(email && { email }),
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        telephone: true,
        adresse: true,
        specialite: true,
        barreau: true,
        numeroPermis: true,
        role: true,
        statut: true,
        creeLe: true,
        modifieLe: true,
        derniereConnexion: true,
      },
    });

    // Invalider les caches
    await this.cacheManager.del(`user:${id}`);
    await this.invalidateUsersCache();

    return updatedUser as UserResponse; // Conversion explicite
  }

  async remove(id: string): Promise<void> {
    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // Suppression logique : changer le statut en INACTIF
    await this.prisma.utilisateur.update({
      where: { id },
      data: { statut: StatutUtilisateur.INACTIF },
    });

    // Invalider les caches
    await this.cacheManager.del(`user:${id}`);
    await this.invalidateUsersCache();
  }

  // -------------------- MÉTHODES SPÉCIFIQUES --------------------
  async changePassword(
    id: string,
    changePasswordDto: ChangerPasswordDto,
  ): Promise<void> {
    const { ancienMotDePasse, nouveauMotDePasse } = changePasswordDto;

    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!utilisateur) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(
      ancienMotDePasse,
      utilisateur.motDePasse,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Ancien mot de passe incorrect');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(nouveauMotDePasse, 10);

    // Mettre à jour le mot de passe
    await this.prisma.utilisateur.update({
      where: { id },
      data: {
        motDePasse: hashedPassword,
        refreshToken: null, // Forcer la reconnexion
      },
    });

    // Invalider le cache
    await this.cacheManager.del(`user:${id}`);
  }

  async getUserStats(id: string): Promise<UserStatsResponse> {
    const cacheKey = `user-stats:${id}`;
    const cachedStats = await this.cacheManager.get(cacheKey);

    if (cachedStats) {
      return cachedStats as UserStatsResponse; // Conversion explicite
    }

    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!utilisateur) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // Récupérer les statistiques
    const [
      totalDossiers,
      dossiersActifs,
      dossiersClos,
      totalTaches,
      tachesEnCours,
      tachesTerminees,
      totalEvenements,
      evenementsAVenir,
      chiffreAffaires,
    ] = await Promise.all([
      // Dossiers
      this.prisma.dossier.count({
        where: { responsableId: id },
      }),
      this.prisma.dossier.count({
        where: {
          responsableId: id,
          statut: { in: ['OUVERT', 'EN_COURS'] },
        },
      }),
      this.prisma.dossier.count({
        where: {
          responsableId: id,
          statut: 'CLOS',
        },
      }),
      // Tâches
      this.prisma.tache.count({
        where: { assigneeId: id },
      }),
      this.prisma.tache.count({
        where: {
          assigneeId: id,
          statut: 'EN_COURS',
        },
      }),
      this.prisma.tache.count({
        where: {
          assigneeId: id,
          statut: 'TERMINEE',
        },
      }),
      // Événements
      this.prisma.evenementCalendrier.count({
        where: { creeParId: id },
      }),
      this.prisma.evenementCalendrier.count({
        where: {
          creeParId: id,
          debut: { gt: new Date() },
        },
      }),
      // Chiffre d'affaires (pour les avocats) - Correction: enlever responsableId
      this.prisma.honoraire.aggregate({
        where: {
          // Correction: utiliser clientId au lieu de responsableId
          clientId: id,
        },
        _sum: { montantTTC: true },
      }),
    ]);

    // Calculer le taux de victoire (pour les avocats)
    let tauxVictoire;
    if (utilisateur.role === RoleUtilisateur.AVOCAT && dossiersClos > 0) {
      const dossiersGagnes = await this.prisma.dossier.count({
        where: {
          responsableId: id,
          statut: 'CLOS',
          // Ici, vous pourriez ajouter un champ pour indiquer si le dossier a été gagné
        },
      });
      tauxVictoire = (dossiersGagnes / dossiersClos) * 100;
    }

    // Conversion explicite de Decimal à number
    const chiffreAffairesValue = chiffreAffaires._sum.montantTTC
      ? Number(chiffreAffaires._sum.montantTTC)
      : 0;

    const stats: UserStatsResponse = {
      totalDossiers,
      dossiersActifs,
      dossiersClos,
      totalTaches,
      tachesEnCours,
      tachesTerminees,
      totalEvenements,
      evenementsAVenir,
      chiffreAffaires: chiffreAffairesValue, // Conversion explicite
      tauxVictoire,
    };

    // Mettre en cache pour 15 minutes
    await this.cacheManager.set(cacheKey, stats, 900);

    return stats;
  }

  async getUserDossiers(id: string, query: QueryUsersDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'creeLe',
      sortOrder = 'desc',
      search,
    } = query;

    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!utilisateur) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // Clé de cache pour cette requête
    const cacheKey = `user-dossiers:${id}:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Construire les filtres
    const where: any = { responsableId: id };

    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { numeroUnique: { contains: search, mode: 'insensitive' } },
        {
          client: {
            OR: [
              { prenom: { contains: search, mode: 'insensitive' } },
              { nom: { contains: search, mode: 'insensitive' } },
              { entreprise: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    // Obtenir les paramètres de pagination
    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Exécuter la requête
    const [dossiers, total] = await Promise.all([
      this.prisma.dossier.findMany({
        where,
        ...paginationParams,
        include: {
          client: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              entreprise: true,
            },
          },
        },
      }),
      this.prisma.dossier.count({ where }),
    ]);

    // Formater la réponse
    const result = PaginationUtil.createPaginationResult(dossiers, total, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  async getUserTaches(id: string, query: QueryUsersDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'creeLe',
      sortOrder = 'desc',
      search,
    } = query;

    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!utilisateur) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // Clé de cache pour cette requête
    const cacheKey = `user-taches:${id}:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Construire les filtres
    const where: any = { assigneeId: id };

    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Obtenir les paramètres de pagination
    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Exécuter la requête
    const [taches, total] = await Promise.all([
      this.prisma.tache.findMany({
        where,
        ...paginationParams,
        include: {
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
            },
          },
          createur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
            },
          },
        },
      }),
      this.prisma.tache.count({ where }),
    ]);

    // Formater la réponse
    const result = PaginationUtil.createPaginationResult(taches, total, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  async getUserEvenements(id: string, query: QueryUsersDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'debut',
      sortOrder = 'asc',
      search,
    } = query;

    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!utilisateur) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // Clé de cache pour cette requête
    const cacheKey = `user-evenements:${id}:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Construire les filtres
    const where: any = { creeParId: id };

    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Obtenir les paramètres de pagination
    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Exécuter la requête
    const [evenements, total] = await Promise.all([
      this.prisma.evenementCalendrier.findMany({
        where,
        ...paginationParams,
        include: {
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
            },
          },
        },
      }),
      this.prisma.evenementCalendrier.count({ where }),
    ]);

    // Formater la réponse
    const result = PaginationUtil.createPaginationResult(evenements, total, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  async getUserNotifications(id: string, query: QueryUsersDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'creeLe',
      sortOrder = 'desc',
    } = query;

    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!utilisateur) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // Clé de cache pour cette requête
    const cacheKey = `user-notifications:${id}:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Obtenir les paramètres de pagination
    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Exécuter la requête
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { utilisateurId: id },
        ...paginationParams,
      }),
      this.prisma.notification.count({ where: { utilisateurId: id } }),
    ]);

    // Formater la réponse
    const result = PaginationUtil.createPaginationResult(notifications, total, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Mettre en cache pour 2 minutes (les notifications changent fréquemment)
    await this.cacheManager.set(cacheKey, result, 120);

    return result;
  }

  async markNotificationsAsRead(id: string): Promise<void> {
    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!utilisateur) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // Marquer toutes les notifications comme lues
    await this.prisma.notification.updateMany({
      where: {
        utilisateurId: id,
        lu: false,
      },
      data: { lu: true },
    });

    // Invalider le cache des notifications
    await this.cacheManager.del(`user-notifications:${id}:*`);
  }

  async getAvocatsDisponibles(dateDebut?: Date, dateFin?: Date) {
    const cacheKey = `avocats-disponibles:${dateDebut?.toISOString() || 'all'}:${dateFin?.toISOString() || 'all'}`;
    const cachedResult = await this.cacheManager.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Récupérer tous les avocats actifs
    const avocats = await this.prisma.utilisateur.findMany({
      where: {
        role: RoleUtilisateur.AVOCAT,
        statut: StatutUtilisateur.ACTIF,
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        specialite: true,
        barreau: true,
        numeroPermis: true,
      },
    });

    // Si des dates sont fournies, vérifier la disponibilité
    if (dateDebut && dateFin) {
      // Récupérer les événements des avocats dans cette période
      const evenements = await this.prisma.evenementCalendrier.findMany({
        where: {
          creeParId: { in: avocats.map((a) => a.id) },
          OR: [
            {
              debut: { lte: dateDebut },
              fin: { gte: dateDebut },
            },
            {
              debut: { lte: dateFin },
              fin: { gte: dateFin },
            },
            {
              debut: { gte: dateDebut },
              fin: { lte: dateFin },
            },
          ],
        },
        select: {
          creeParId: true,
        },
      });

      // Identifier les avocats occupés
      const avocatsOccupes = new Set(evenements.map((e) => e.creeParId));

      // Filtrer les avocats disponibles
      const avocatsDisponibles = avocats.filter(
        (a) => !avocatsOccupes.has(a.id),
      );

      // Mettre en cache pour 10 minutes
      await this.cacheManager.set(cacheKey, avocatsDisponibles, 600);

      return avocatsDisponibles;
    }

    // Mettre en cache pour 30 minutes (sans filtre de dates)
    await this.cacheManager.set(cacheKey, avocats, 1800);

    return avocats;
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private async invalidateUsersCache(): Promise<void> {
    try {
      // Invalider tous les caches liés aux utilisateurs
      // Note: Cette implémentation dépend de votre version de cache-manager
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores) &&
        this.cacheManager.stores.length > 0
      ) {
        const store = this.cacheManager.stores[0];

        // Si le store a une méthode keys
        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('users:*');
          if (keys.length > 0) {
            // Correction: utiliser la méthode delete au lieu de del
            if ('delete' in store && typeof store.delete === 'function') {
              await Promise.all(keys.map((key) => store.delete(key)));
            } else if ('clear' in store && typeof store.clear === 'function') {
              await store.clear();
            }
          }
        } else if ('clear' in store && typeof store.clear === 'function') {
          await store.clear();
        }
      } else if (
        'reset' in this.cacheManager &&
        typeof this.cacheManager.reset === 'function'
      ) {
        // Alternative: vider tout le cache
        await this.cacheManager.reset();
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'invalidation du cache des utilisateurs:",
        error,
      );
    }
  }
}
