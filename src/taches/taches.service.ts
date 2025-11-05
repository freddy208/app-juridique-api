/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateTacheDto } from './dto/create-tache.dto';
import { UpdateTacheDto } from './dto/update-tache.dto';
import { StatutTache, TachePriorite } from '@prisma/client';
import { PaginationUtil } from '../common/utils/pagination.util';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  TacheResponse,
  TacheStatsResponse,
} from './interfaces/tache.interface';
import { QueryTachesDto } from './dto/filter-tache.dto';

@Injectable()
export class TachesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  // -------------------- CRUD DE BASE --------------------
  async create(
    createTacheDto: CreateTacheDto,
    creeParId: string,
  ): Promise<TacheResponse> {
    const { titre, description, dossierId, assigneeId, priorite, dateLimite } =
      createTacheDto;

    // Vérifier si le dossier existe (si spécifié)
    if (dossierId) {
      const dossier = await this.prisma.dossier.findUnique({
        where: { id: dossierId },
      });

      if (!dossier) {
        throw new NotFoundException(
          `Dossier avec l'ID ${dossierId} non trouvé`,
        );
      }
    }

    // Vérifier si l'utilisateur assigné existe (si spécifié)
    if (assigneeId) {
      const utilisateur = await this.prisma.utilisateur.findUnique({
        where: { id: assigneeId },
      });

      if (!utilisateur) {
        throw new NotFoundException(
          `Utilisateur avec l'ID ${assigneeId} non trouvé`,
        );
      }
    }

    // Créer la tâche
    const tache = await this.prisma.tache.create({
      data: {
        titre,
        description,
        dossierId,
        assigneeId,
        creeParId,
        priorite: priorite || TachePriorite.MOYENNE,
        dateLimite,
      },
      include: {
        assignee: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
        createur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            type: true,
            statut: true,
          },
        },
      },
    });

    // Envoyer une notification à l'utilisateur assigné (si différent du créateur)
    if (assigneeId && assigneeId !== creeParId) {
      await this.notificationsService.create({
        utilisateurId: assigneeId,
        titre: 'Nouvelle tâche assignée',
        message: `Vous avez une nouvelle tâche: ${titre}`,
        type: 'TACHE',
        lien: `/taches/${tache.id}`,
      });
    }

    // Vérifier si la tâche est en retard ou à échéance proche
    await this.checkTacheEcheance(tache);

    // Invalider le cache
    await this.invalidateTachesCache();

    return this.formatTacheResponse(tache);
  }

  async findAll(query: QueryTachesDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'creeLe',
      sortOrder = 'desc',
      assigneeId,
      creeParId,
      dossierId,
      statut,
      priorite,
      dateLimiteMin,
      dateLimiteMax,
      search,
      enRetard,
    } = query;

    // Clé de cache pour cette requête
    const cacheKey = `taches:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Construire les filtres
    const where: any = {};

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (creeParId) {
      where.creeParId = creeParId;
    }

    if (dossierId) {
      where.dossierId = dossierId;
    }

    if (statut) {
      where.statut = statut;
    }

    if (priorite) {
      where.priorite = priorite;
    }

    if (dateLimiteMin || dateLimiteMax) {
      where.dateLimite = {};
      if (dateLimiteMin) {
        where.dateLimite.gte = dateLimiteMin;
      }
      if (dateLimiteMax) {
        where.dateLimite.lte = dateLimiteMax;
      }
    }

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
          assignee: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              role: true,
            },
          },
          createur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              role: true,
            },
          },
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
              type: true,
              statut: true,
            },
          },
        },
      }),
      this.prisma.tache.count({ where }),
    ]);

    // Formater les tâches
    const formattedTaches = taches.map((tache) =>
      this.formatTacheResponse(tache),
    );

    // Filtrer les tâches en retard si demandé
    let filteredTaches = formattedTaches;
    if (enRetard) {
      filteredTaches = formattedTaches.filter((tache) => tache.enRetard);
    }

    // Formater la réponse
    const result = PaginationUtil.createPaginationResult(
      filteredTaches,
      total,
      {
        page,
        limit,
        sortBy,
        sortOrder,
      },
    );

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  async findOne(id: string): Promise<TacheResponse> {
    const cacheKey = `tache:${id}`;
    const cachedTache = await this.cacheManager.get(cacheKey);

    if (cachedTache) {
      return cachedTache as TacheResponse;
    }

    const tache = await this.prisma.tache.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
        createur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            type: true,
            statut: true,
          },
        },
        Commentaire: {
          include: {
            utilisateur: {
              select: {
                id: true,
                prenom: true,
                nom: true,
              },
            },
          },
          orderBy: {
            creeLe: 'desc',
          },
        },
      },
    });

    if (!tache) {
      throw new NotFoundException(`Tâche avec l'ID ${id} non trouvée`);
    }

    // Mettre en cache pour 10 minutes
    await this.cacheManager.set(cacheKey, tache, 600);

    return this.formatTacheResponse(tache);
  }

  async update(
    id: string,
    updateTacheDto: UpdateTacheDto,
  ): Promise<TacheResponse> {
    // Vérifier si la tâche existe
    const existingTache = await this.prisma.tache.findUnique({
      where: { id },
    });

    if (!existingTache) {
      throw new NotFoundException(`Tâche avec l'ID ${id} non trouvée`);
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (updateTacheDto.titre !== undefined) {
      updateData.titre = updateTacheDto.titre;
    }
    if (updateTacheDto.description !== undefined) {
      updateData.description = updateTacheDto.description;
    }
    if (updateTacheDto.assigneeId !== undefined) {
      updateData.assigneeId = updateTacheDto.assigneeId;
    }
    if (updateTacheDto.priorite !== undefined) {
      updateData.priorite = updateTacheDto.priorite;
    }
    if (updateTacheDto.statut !== undefined) {
      updateData.statut = updateTacheDto.statut;
    }
    if (updateTacheDto.dateLimite !== undefined) {
      updateData.dateLimite = updateTacheDto.dateLimite;
    }

    // Mettre à jour la tâche
    const updatedTache = await this.prisma.tache.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
        createur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            type: true,
            statut: true,
          },
        },
      },
    });

    // Envoyer une notification si le statut a changé
    if (
      updateTacheDto.statut &&
      updateTacheDto.statut !== existingTache.statut &&
      updatedTache.assigneeId
    ) {
      await this.notificationsService.create({
        utilisateurId: updatedTache.assigneeId,
        titre: 'Statut de tâche mis à jour',
        message: `Le statut de la tâche "${updatedTache.titre}" a été mis à jour: ${updateTacheDto.statut}`,
        type: 'TACHE',
        lien: `/taches/${updatedTache.id}`,
      });
    }

    // Vérifier si la tâche est en retard ou à échéance proche
    await this.checkTacheEcheance(updatedTache);

    // Invalider les caches
    await this.cacheManager.del(`tache:${id}`);
    await this.invalidateTachesCache();

    return this.formatTacheResponse(updatedTache);
  }

  async remove(id: string): Promise<void> {
    // Vérifier si la tâche existe
    const existingTache = await this.prisma.tache.findUnique({
      where: { id },
    });

    if (!existingTache) {
      throw new NotFoundException(`Tâche avec l'ID ${id} non trouvée`);
    }

    // Supprimer la tâche
    await this.prisma.tache.delete({
      where: { id },
    });

    // Invalider les caches
    await this.cacheManager.del(`tache:${id}`);
    await this.invalidateTachesCache();
  }

  // -------------------- MÉTHODES SPÉCIFIQUES --------------------
  async getTachesByDossier(dossierId: string, query: QueryTachesDto) {
    // Vérifier si le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
    });

    if (!dossier) {
      throw new NotFoundException(`Dossier avec l'ID ${dossierId} non trouvé`);
    }

    // Utiliser findAll avec le filtre dossierId
    return this.findAll({
      ...query,
      dossierId,
    });
  }

  async getTachesByAssignee(assigneeId: string, query: QueryTachesDto) {
    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: assigneeId },
    });

    if (!utilisateur) {
      throw new NotFoundException(
        `Utilisateur avec l'ID ${assigneeId} non trouvé`,
      );
    }

    // Utiliser findAll avec le filtre assigneeId
    return this.findAll({
      ...query,
      assigneeId,
    });
  }

  async getTachesByCreateur(creeParId: string, query: QueryTachesDto) {
    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: creeParId },
    });

    if (!utilisateur) {
      throw new NotFoundException(
        `Utilisateur avec l'ID ${creeParId} non trouvé`,
      );
    }

    // Utiliser findAll avec le filtre creeParId
    return this.findAll({
      ...query,
      creeParId,
    });
  }

  async getTachesEnRetard(query: QueryTachesDto) {
    // Utiliser findAll avec le filtre enRetard
    return this.findAll({
      ...query,
      enRetard: true,
    });
  }

  async getTachesAEcheanceProche(jours: number = 3, query: QueryTachesDto) {
    const dateLimiteMax = new Date();
    dateLimiteMax.setDate(dateLimiteMax.getDate() + jours);

    // Utiliser findAll avec le filtre dateLimiteMax
    return this.findAll({
      ...query,
      dateLimiteMax,
    });
  }

  async getStats(utilisateurId?: string): Promise<TacheStatsResponse> {
    const cacheKey = `taches-stats:${utilisateurId || 'global'}`;
    const cachedStats = await this.cacheManager.get(cacheKey);

    if (cachedStats) {
      return cachedStats as TacheStatsResponse;
    }

    // Construire les filtres
    const where: any = {};
    if (utilisateurId) {
      where.assigneeId = utilisateurId;
    }

    // Récupérer les statistiques
    const [
      total,
      tachesAFaire,
      tachesEnCours,
      tachesTerminees,
      tachesBassePriorite,
      tachesMoyennePriorite,
      tachesHautePriorite,
      tachesUrgentePriorite,
      recentes,
    ] = await Promise.all([
      // Total des tâches
      this.prisma.tache.count({ where }),
      // Tâches par statut
      this.prisma.tache.count({
        where: { ...where, statut: StatutTache.A_FAIRE },
      }),
      this.prisma.tache.count({
        where: { ...where, statut: StatutTache.EN_COURS },
      }),
      this.prisma.tache.count({
        where: { ...where, statut: StatutTache.TERMINEE },
      }),
      // Tâches par priorité
      this.prisma.tache.count({
        where: { ...where, priorite: TachePriorite.BASSE },
      }),
      this.prisma.tache.count({
        where: { ...where, priorite: TachePriorite.MOYENNE },
      }),
      this.prisma.tache.count({
        where: { ...where, priorite: TachePriorite.HAUTE },
      }),
      this.prisma.tache.count({
        where: { ...where, priorite: TachePriorite.URGENTE },
      }),
      // Tâches récentes
      this.prisma.tache.findMany({
        where,
        orderBy: { creeLe: 'desc' },
        take: 5,
        include: {
          assignee: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              role: true,
            },
          },
          createur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              role: true,
            },
          },
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
              type: true,
              statut: true,
            },
          },
        },
      }),
    ]);

    // Calculer les tâches en retard
    const tachesEnRetard = await this.prisma.tache.count({
      where: {
        ...where,
        dateLimite: {
          lt: new Date(),
        },
        statut: {
          not: StatutTache.TERMINEE,
        },
      },
    });

    // Calculer les tâches à échéance proche (dans les 3 prochains jours)
    const dateEcheanceProche = new Date();
    dateEcheanceProche.setDate(dateEcheanceProche.getDate() + 3);

    const tachesAEcheanceProche = await this.prisma.tache.count({
      where: {
        ...where,
        dateLimite: {
          gte: new Date(),
          lte: dateEcheanceProche,
        },
        statut: {
          not: StatutTache.TERMINEE,
        },
      },
    });

    // Statistiques par utilisateur
    // Par cette ligne avec le type explicite :
    let parUtilisateur: {
      id: string;
      prenom: string;
      nom: string;
      total: number;
      completes: number;
      enRetard: number;
      tauxCompletion: number;
    }[] = [];
    if (!utilisateurId) {
      const utilisateurs = await this.prisma.utilisateur.findMany({
        where: {
          role: {
            in: ['ADMIN', 'DG', 'AVOCAT', 'SECRETAIRE', 'ASSISTANT', 'JURISTE'],
          },
          statut: 'ACTIF',
        },
        select: {
          id: true,
          prenom: true,
          nom: true,
        },
      });

      parUtilisateur = await Promise.all(
        utilisateurs.map(async (utilisateur) => {
          const utilisateurWhere = { assigneeId: utilisateur.id };
          const [totalUtilisateur, completesUtilisateur, enRetardUtilisateur] =
            await Promise.all([
              this.prisma.tache.count({ where: utilisateurWhere }),
              this.prisma.tache.count({
                where: { ...utilisateurWhere, statut: StatutTache.TERMINEE },
              }),
              this.prisma.tache.count({
                where: {
                  ...utilisateurWhere,
                  dateLimite: {
                    lt: new Date(),
                  },
                  statut: {
                    not: StatutTache.TERMINEE,
                  },
                },
              }),
            ]);

          return {
            id: utilisateur.id,
            prenom: utilisateur.prenom,
            nom: utilisateur.nom,
            total: totalUtilisateur,
            completes: completesUtilisateur,
            enRetard: enRetardUtilisateur,
            tauxCompletion:
              totalUtilisateur > 0
                ? Math.round((completesUtilisateur / totalUtilisateur) * 100)
                : 0,
          };
        }),
      );
    }

    const stats: TacheStatsResponse = {
      total,
      parStatut: {
        a_faire: tachesAFaire,
        en_cours: tachesEnCours,
        terminee: tachesTerminees,
      },
      parPriorite: {
        basse: tachesBassePriorite,
        moyenne: tachesMoyennePriorite,
        haute: tachesHautePriorite,
        urgente: tachesUrgentePriorite,
      },
      enRetard: tachesEnRetard,
      aEcheanceProche: tachesAEcheanceProche,
      parUtilisateur,
      recentes: recentes.map((tache) => this.formatTacheResponse(tache)),
    };

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300);

    return stats;
  }

  async searchTaches(searchTerm: string, query: QueryTachesDto) {
    // Utiliser findAll avec le terme de recherche
    return this.findAll({
      ...query,
      search: searchTerm,
    });
  }

  async changerStatutTache(
    id: string,
    statut: StatutTache,
  ): Promise<TacheResponse> {
    // Vérifier si la tâche existe
    const existingTache = await this.prisma.tache.findUnique({
      where: { id },
    });

    if (!existingTache) {
      throw new NotFoundException(`Tâche avec l'ID ${id} non trouvée`);
    }

    // Mettre à jour le statut de la tâche
    const updatedTache = await this.prisma.tache.update({
      where: { id },
      data: { statut },
      include: {
        assignee: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
        createur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            type: true,
            statut: true,
          },
        },
      },
    });

    // Envoyer une notification à l'utilisateur assigné
    if (updatedTache.assigneeId) {
      await this.notificationsService.create({
        utilisateurId: updatedTache.assigneeId,
        titre: 'Statut de tâche mis à jour',
        message: `Le statut de la tâche "${updatedTache.titre}" a été mis à jour: ${statut}`,
        type: 'TACHE',
        lien: `/taches/${updatedTache.id}`,
      });
    }

    // Invalider les caches
    await this.cacheManager.del(`tache:${id}`);
    await this.invalidateTachesCache();

    return this.formatTacheResponse(updatedTache);
  }

  async assignerTache(id: string, assigneeId: string): Promise<TacheResponse> {
    // Vérifier si la tâche existe
    const existingTache = await this.prisma.tache.findUnique({
      where: { id },
    });

    if (!existingTache) {
      throw new NotFoundException(`Tâche avec l'ID ${id} non trouvée`);
    }

    // Vérifier si l'utilisateur assigné existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: assigneeId },
    });

    if (!utilisateur) {
      throw new NotFoundException(
        `Utilisateur avec l'ID ${assigneeId} non trouvé`,
      );
    }

    // Mettre à jour l'assignation de la tâche
    const updatedTache = await this.prisma.tache.update({
      where: { id },
      data: { assigneeId },
      include: {
        assignee: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
        createur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            type: true,
            statut: true,
          },
        },
      },
    });

    // Envoyer une notification à l'utilisateur assigné
    await this.notificationsService.create({
      utilisateurId: assigneeId,
      titre: 'Nouvelle tâche assignée',
      message: `Vous avez une nouvelle tâche: ${updatedTache.titre}`,
      type: 'TACHE',
      lien: `/taches/${updatedTache.id}`,
    });

    // Invalider les caches
    await this.cacheManager.del(`tache:${id}`);
    await this.invalidateTachesCache();

    return this.formatTacheResponse(updatedTache);
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private formatTacheResponse(tache: any): TacheResponse {
    const now = new Date();
    const dateLimite = tache.dateLimite ? new Date(tache.dateLimite) : null;
    const enRetard = dateLimite
      ? dateLimite < now && tache.statut !== StatutTache.TERMINEE
      : false;
    const joursRestants = dateLimite
      ? Math.ceil(
          (dateLimite.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        )
      : undefined;

    return {
      id: tache.id,
      titre: tache.titre,
      description: tache.description,
      statut: tache.statut,
      priorite: tache.priorite,
      dateLimite: tache.dateLimite,
      creeLe: tache.creeLe,
      modifieLe: tache.modifieLe,
      tags: tache.tags,
      enRetard,
      joursRestants,
      assignee: tache.assignee,
      createur: tache.createur,
      dossier: tache.dossier,
      commentaires: tache.Commentaire?.map((commentaire) => ({
        id: commentaire.id,
        contenu: commentaire.contenu,
        creeLe: commentaire.creeLe,
        utilisateur: commentaire.utilisateur,
      })),
    };
  }

  private async checkTacheEcheance(tache: any): Promise<void> {
    if (!tache.dateLimite || tache.statut === StatutTache.TERMINEE) {
      return;
    }

    const now = new Date();
    const dateLimite = new Date(tache.dateLimite);
    const joursRestants = Math.ceil(
      (dateLimite.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Si la tâche est en retard
    if (joursRestants < 0 && tache.assigneeId) {
      await this.notificationsService.create({
        utilisateurId: tache.assigneeId,
        titre: 'Tâche en retard',
        message: `La tâche "${tache.titre}" est en retard de ${Math.abs(joursRestants)} jour(s)`,
        type: 'ALERTE',
        lien: `/taches/${tache.id}`,
      });
    }
    // Si la tâche est à échéance proche (dans les 3 prochains jours)
    else if (joursRestants >= 0 && joursRestants <= 3 && tache.assigneeId) {
      await this.notificationsService.create({
        utilisateurId: tache.assigneeId,
        titre: 'Tâche à échéance proche',
        message: `La tâche "${tache.titre}" doit être complétée dans ${joursRestants} jour(s)`,
        type: 'ALERTE',
        lien: `/taches/${tache.id}`,
      });
    }
  }

  private async invalidateTachesCache(): Promise<void> {
    try {
      // Invalider tous les caches liés aux tâches
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores) &&
        this.cacheManager.stores.length > 0
      ) {
        const store = this.cacheManager.stores[0];

        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('taches:*');
          if (
            keys.length > 0 &&
            'delete' in store &&
            typeof store.delete === 'function'
          ) {
            await Promise.all(keys.map((key) => store.delete(key)));
          }
        }
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'invalidation du cache des tâches:",
        error,
      );
    }
  }
}
