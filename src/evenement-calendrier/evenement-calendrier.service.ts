/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable no-case-declarations */
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
import { CreateEvenementDto } from './dto/create-evenement.dto';
import { UpdateEvenementDto } from './dto/update-evenement.dto';
import { StatutEvenement } from '@prisma/client';
import { PaginationUtil } from '../common/utils/pagination.util';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  EvenementResponse,
  EvenementStatsResponse,
} from './interfaces/evenement.interface';
import { QueryEvenementsDto } from './dto/filter-evenement.dto';

@Injectable()
export class EvenementsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  // -------------------- CRUD DE BASE --------------------
  async create(
    createEvenementDto: CreateEvenementDto,
    creeParId: string,
  ): Promise<EvenementResponse> {
    const { titre, description, dossierId, debut, fin } = createEvenementDto;

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

    // Vérifier si l'utilisateur créateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: creeParId },
    });

    if (!utilisateur) {
      throw new NotFoundException(
        `Utilisateur avec l'ID ${creeParId} non trouvé`,
      );
    }

    // Créer l'événement
    const evenement = await this.prisma.evenementCalendrier.create({
      data: {
        titre,
        description,
        dossierId,
        debut,
        fin,
        creeParId,
      },
      include: {
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

    // Vérifier si l'événement est à échéance proche
    await this.checkEvenementEcheance(evenement);

    // Invalider le cache
    await this.invalidateEvenementsCache();

    return this.formatEvenementResponse(evenement);
  }

  async findAll(query: QueryEvenementsDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'debut',
      sortOrder = 'asc',
      creeParId,
      dossierId,
      statut,
      dateDebutMin,
      dateDebutMax,
      dateFinMin,
      dateFinMax,
      search,
      view,
      referenceDate,
    } = query;

    // Clé de cache pour cette requête
    const cacheKey = `evenements:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Construire les filtres
    const where: any = {};

    if (creeParId) {
      where.creeParId = creeParId;
    }

    if (dossierId) {
      where.dossierId = dossierId;
    }

    if (statut) {
      where.statut = statut;
    }

    if (dateDebutMin || dateDebutMax) {
      where.debut = {};
      if (dateDebutMin) {
        where.debut.gte = dateDebutMin;
      }
      if (dateDebutMax) {
        where.debut.lte = dateDebutMax;
      }
    }

    if (dateFinMin || dateFinMax) {
      where.fin = {};
      if (dateFinMin) {
        where.fin.gte = dateFinMin;
      }
      if (dateFinMax) {
        where.fin.lte = dateFinMax;
      }
    }

    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Gestion des vues calendrier
    if (view && referenceDate) {
      const refDate = new Date(referenceDate);
      const startOfDay = new Date(refDate);
      startOfDay.setHours(0, 0, 0, 0);

      let endOfDay = new Date(refDate);

      switch (view) {
        case 'day':
          endOfDay.setHours(23, 59, 59, 999);
          where.debut = { gte: startOfDay, lte: endOfDay };
          break;
        case 'week':
          const dayOfWeek = refDate.getDay();
          const startOfWeek = new Date(startOfDay);
          startOfWeek.setDate(startOfDay.getDate() - dayOfWeek);

          endOfDay = new Date(startOfWeek);
          endOfDay.setDate(startOfWeek.getDate() + 6);
          endOfDay.setHours(23, 59, 59, 999);

          where.debut = { gte: startOfWeek, lte: endOfDay };
          break;
        case 'month':
          const month = refDate.getMonth();
          const year = refDate.getFullYear();

          const startOfMonth = new Date(year, month, 1);
          const endOfMonth = new Date(year, month + 1, 0);
          endOfMonth.setHours(23, 59, 59, 999);

          where.debut = { gte: startOfMonth, lte: endOfMonth };
          break;
      }
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
      this.prisma.evenementCalendrier.count({ where }),
    ]);

    // Formater les événements
    const formattedEvenements = evenements.map((evenement) =>
      this.formatEvenementResponse(evenement),
    );

    // Formater la réponse
    const result = PaginationUtil.createPaginationResult(
      formattedEvenements,
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

  async findOne(id: string): Promise<EvenementResponse> {
    const cacheKey = `evenement:${id}`;
    const cachedEvenement = await this.cacheManager.get(cacheKey);

    if (cachedEvenement) {
      return cachedEvenement as EvenementResponse;
    }

    const evenement = await this.prisma.evenementCalendrier.findUnique({
      where: { id },
      include: {
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

    if (!evenement) {
      throw new NotFoundException(`Événement avec l'ID ${id} non trouvé`);
    }

    // Mettre en cache pour 10 minutes
    await this.cacheManager.set(cacheKey, evenement, 600);

    return this.formatEvenementResponse(evenement);
  }

  async update(
    id: string,
    updateEvenementDto: UpdateEvenementDto,
  ): Promise<EvenementResponse> {
    // Vérifier si l'événement existe
    const existingEvenement = await this.prisma.evenementCalendrier.findUnique({
      where: { id },
    });

    if (!existingEvenement) {
      throw new NotFoundException(`Événement avec l'ID ${id} non trouvé`);
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (updateEvenementDto.titre !== undefined) {
      updateData.titre = updateEvenementDto.titre;
    }
    if (updateEvenementDto.description !== undefined) {
      updateData.description = updateEvenementDto.description;
    }
    if (updateEvenementDto.dossierId !== undefined) {
      updateData.dossierId = updateEvenementDto.dossierId;
    }
    if (updateEvenementDto.debut !== undefined) {
      updateData.debut = updateEvenementDto.debut;
    }
    if (updateEvenementDto.fin !== undefined) {
      updateData.fin = updateEvenementDto.fin;
    }
    if (updateEvenementDto.statut !== undefined) {
      updateData.statut = updateEvenementDto.statut;
    }

    // Mettre à jour l'événement
    const updatedEvenement = await this.prisma.evenementCalendrier.update({
      where: { id },
      data: updateData,
      include: {
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
      updateEvenementDto.statut &&
      updateEvenementDto.statut !== existingEvenement.statut
    ) {
      await this.notificationsService.create({
        utilisateurId: updatedEvenement.creeParId,
        titre: "Statut d'événement mis à jour",
        message: `Le statut de l'événement "${updatedEvenement.titre}" a été mis à jour: ${updateEvenementDto.statut}`,
        type: 'AUDIENCE',
        lien: `/evenements/${updatedEvenement.id}`,
      });
    }

    // Vérifier si l'événement est à échéance proche
    await this.checkEvenementEcheance(updatedEvenement);

    // Invalider les caches
    await this.cacheManager.del(`evenement:${id}`);
    await this.invalidateEvenementsCache();

    return this.formatEvenementResponse(updatedEvenement);
  }

  async remove(id: string): Promise<void> {
    // Vérifier si l'événement existe
    const existingEvenement = await this.prisma.evenementCalendrier.findUnique({
      where: { id },
    });

    if (!existingEvenement) {
      throw new NotFoundException(`Événement avec l'ID ${id} non trouvé`);
    }

    // Supprimer l'événement
    await this.prisma.evenementCalendrier.delete({
      where: { id },
    });

    // Invalider les caches
    await this.cacheManager.del(`evenement:${id}`);
    await this.invalidateEvenementsCache();
  }

  // -------------------- MÉTHODES SPÉCIFIQUES --------------------
  async getEvenementsByDossier(dossierId: string, query: QueryEvenementsDto) {
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

  async getEvenementsByCreateur(creeParId: string, query: QueryEvenementsDto) {
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

  async getEvenementsAujourdHui(query: QueryEvenementsDto) {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Utiliser findAll avec les filtres de date
    return this.findAll({
      ...query,
      dateDebutMin: startOfDay,
      dateDebutMax: endOfDay,
    });
  }

  async getEvenementsCetteSemaine(query: QueryEvenementsDto) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Utiliser findAll avec les filtres de date
    return this.findAll({
      ...query,
      dateDebutMin: startOfWeek,
      dateDebutMax: endOfWeek,
    });
  }

  async getEvenementsCeMois(query: QueryEvenementsDto) {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Utiliser findAll avec les filtres de date
    return this.findAll({
      ...query,
      dateDebutMin: startOfMonth,
      dateDebutMax: endOfMonth,
    });
  }

  async getEvenementsAVenir(query: QueryEvenementsDto) {
    const now = new Date();

    // Utiliser findAll avec le filtre dateDebutMin
    return this.findAll({
      ...query,
      dateDebutMin: now,
      statut: StatutEvenement.PREVU,
    });
  }

  async getStats(utilisateurId?: string): Promise<EvenementStatsResponse> {
    const cacheKey = `evenements-stats:${utilisateurId || 'global'}`;
    const cachedStats = await this.cacheManager.get(cacheKey);

    if (cachedStats) {
      return cachedStats as EvenementStatsResponse;
    }

    // Construire les filtres
    const where: any = {};
    if (utilisateurId) {
      where.creeParId = utilisateurId;
    }

    // Dates pour les statistiques
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const month = now.getMonth();
    const year = now.getFullYear();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Récupérer les statistiques
    const [
      total,
      evenementsPrevus,
      evenementsTermines,
      evenementsAnnules,
      evenementsCeMois,
      evenementsCetteSemaine,
      evenementsAujourdHui,
      evenementsAVenir,
      evenementsPasses,
      recentes,
    ] = await Promise.all([
      // Total des événements
      this.prisma.evenementCalendrier.count({ where }),
      // Événements par statut
      this.prisma.evenementCalendrier.count({
        where: { ...where, statut: StatutEvenement.PREVU },
      }),
      this.prisma.evenementCalendrier.count({
        where: { ...where, statut: StatutEvenement.TERMINE },
      }),
      this.prisma.evenementCalendrier.count({
        where: { ...where, statut: StatutEvenement.ANNULE },
      }),
      // Événements par période
      this.prisma.evenementCalendrier.count({
        where: {
          ...where,
          debut: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      this.prisma.evenementCalendrier.count({
        where: {
          ...where,
          debut: { gte: startOfWeek, lte: endOfWeek },
        },
      }),
      this.prisma.evenementCalendrier.count({
        where: {
          ...where,
          debut: { gte: today, lte: endOfDay },
        },
      }),
      this.prisma.evenementCalendrier.count({
        where: {
          ...where,
          debut: { gte: now },
          statut: StatutEvenement.PREVU,
        },
      }),
      this.prisma.evenementCalendrier.count({
        where: {
          ...where,
          fin: { lt: now },
        },
      }),
      // Événements récents
      this.prisma.evenementCalendrier.findMany({
        where,
        orderBy: { creeLe: 'desc' },
        take: 5,
        include: {
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

    // Événements à venir prochains
    const aVenirProchains = await this.prisma.evenementCalendrier.findMany({
      where: {
        ...where,
        debut: { gte: now },
        statut: StatutEvenement.PREVU,
      },
      orderBy: { debut: 'asc' },
      take: 5,
      include: {
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

    // Statistiques par utilisateur
    let parUtilisateur: Array<{
      id: string;
      prenom: string;
      nom: string;
      total: number;
      completes: number;
      enRetard: number;
      tauxCompletion: number;
    }> = [];
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
          const utilisateurWhere = { creeParId: utilisateur.id };
          const [totalUtilisateur, completesUtilisateur, enRetardUtilisateur] =
            await Promise.all([
              this.prisma.evenementCalendrier.count({
                where: utilisateurWhere,
              }),
              this.prisma.evenementCalendrier.count({
                where: { ...utilisateurWhere, statut: StatutEvenement.TERMINE },
              }),
              this.prisma.evenementCalendrier.count({
                where: {
                  ...utilisateurWhere,
                  fin: {
                    lt: now,
                  },
                  statut: {
                    not: StatutEvenement.TERMINE,
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

    const stats: EvenementStatsResponse = {
      total,
      parStatut: {
        prevu: evenementsPrevus,
        termine: evenementsTermines,
        annule: evenementsAnnules,
      },
      ceMois: evenementsCeMois,
      cetteSemaine: evenementsCetteSemaine,
      aujourdHui: evenementsAujourdHui,
      aVenir: evenementsAVenir,
      passes: evenementsPasses,
      parUtilisateur,
      recentes: recentes.map((evenement) =>
        this.formatEvenementResponse(evenement),
      ),
      aVenirProchains: aVenirProchains.map((evenement) =>
        this.formatEvenementResponse(evenement),
      ),
    };

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300);

    return stats;
  }

  async searchEvenements(searchTerm: string, query: QueryEvenementsDto) {
    // Utiliser findAll avec le terme de recherche
    return this.findAll({
      ...query,
      search: searchTerm,
    });
  }

  async changerStatutEvenement(
    id: string,
    statut: StatutEvenement,
  ): Promise<EvenementResponse> {
    // Vérifier si l'événement existe
    const existingEvenement = await this.prisma.evenementCalendrier.findUnique({
      where: { id },
    });

    if (!existingEvenement) {
      throw new NotFoundException(`Événement avec l'ID ${id} non trouvé`);
    }

    // Mettre à jour le statut de l'événement
    const updatedEvenement = await this.prisma.evenementCalendrier.update({
      where: { id },
      data: { statut },
      include: {
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

    // Envoyer une notification au créateur
    await this.notificationsService.create({
      utilisateurId: updatedEvenement.creeParId,
      titre: "Statut d'événement mis à jour",
      message: `Le statut de l'événement "${updatedEvenement.titre}" a été mis à jour: ${statut}`,
      type: 'AUDIENCE',
      lien: `/evenements/${updatedEvenement.id}`,
    });

    // Invalider les caches
    await this.cacheManager.del(`evenement:${id}`);
    await this.invalidateEvenementsCache();

    return this.formatEvenementResponse(updatedEvenement);
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private formatEvenementResponse(evenement: any): EvenementResponse {
    const now = new Date();
    const debut = new Date(evenement.debut);
    const fin = new Date(evenement.fin);
    const estPasse = fin < now;
    const estEnCours = debut <= now && fin >= now;
    const dureeMinutes = Math.round(
      (fin.getTime() - debut.getTime()) / (1000 * 60),
    );

    return {
      id: evenement.id,
      titre: evenement.titre,
      description: evenement.description,
      debut: evenement.debut,
      fin: evenement.fin,
      statut: evenement.statut,
      creeLe: evenement.creeLe,
      modifieLe: evenement.modifieLe,
      estPasse,
      estEnCours,
      dureeMinutes,
      createur: evenement.createur,
      dossier: evenement.dossier,
    };
  }

  private async checkEvenementEcheance(evenement: any): Promise<void> {
    if (
      evenement.statut === StatutEvenement.TERMINE ||
      evenement.statut === StatutEvenement.ANNULE
    ) {
      return;
    }

    const now = new Date();
    const debut = new Date(evenement.debut);
    const heuresRestantes = Math.ceil(
      (debut.getTime() - now.getTime()) / (1000 * 60 * 60),
    );

    // Si l'événement est dans moins de 24 heures
    if (heuresRestantes > 0 && heuresRestantes <= 24) {
      await this.notificationsService.create({
        utilisateurId: evenement.creeParId,
        titre: "Rappel d'événement",
        message: `L'événement "${evenement.titre}" est prévu dans ${heuresRestantes} heure(s)`,
        type: 'AUDIENCE',
        lien: `/evenements/${evenement.id}`,
      });
    }
  }

  private async invalidateEvenementsCache(): Promise<void> {
    try {
      // Invalider tous les caches liés aux événements
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores) &&
        this.cacheManager.stores.length > 0
      ) {
        const store = this.cacheManager.stores[0];

        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('evenements:*');
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
        "❌ Erreur lors de l'invalidation du cache des événements:",
        error,
      );
    }
  }
  // Ajoutez ces méthodes dans votre fichier evenement-calendrier.service.ts

  async updateEvenementByProcedureAndDate(
    procedureId: string,
    dateAudience: Date,
    updateData: Partial<UpdateEvenementDto>,
  ): Promise<EvenementResponse> {
    // Rechercher l'événement correspondant à cette procédure et date
    const evenement = await this.prisma.evenementCalendrier.findFirst({
      where: {
        dossierId: procedureId, // Note: vous utilisez procedureId mais la recherche se fait sur dossierId
        debut: {
          gte: new Date(dateAudience.setHours(0, 0, 0, 0)),
          lt: new Date(dateAudience.setHours(23, 59, 59, 999)),
        },
      },
    });

    if (!evenement) {
      throw new NotFoundException(
        `Événement non trouvé pour la procédure ${procedureId} à la date ${dateAudience}`,
      );
    }

    // Mettre à jour l'événement
    return this.update(evenement.id, updateData);
  }

  async removeEvenementByProcedureAndDate(
    procedureId: string,
    dateAudience: Date,
  ): Promise<void> {
    // Rechercher l'événement correspondant à cette procédure et date
    const evenement = await this.prisma.evenementCalendrier.findFirst({
      where: {
        dossierId: procedureId, // Note: vous utilisez procedureId mais la recherche se fait sur dossierId
        debut: {
          gte: new Date(dateAudience.setHours(0, 0, 0, 0)),
          lt: new Date(dateAudience.setHours(23, 59, 59, 999)),
        },
      },
    });

    if (!evenement) {
      throw new NotFoundException(
        `Événement non trouvé pour la procédure ${procedureId} à la date ${dateAudience}`,
      );
    }

    // Supprimer l'événement
    await this.remove(evenement.id);
  }
}
