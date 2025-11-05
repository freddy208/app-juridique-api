/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateJurisprudenceDto } from './dto/create-jurisprudence.dto';
import { UpdateJurisprudenceDto } from './dto/update-jurisprudence.dto';
import { CreateDossierJurisprudenceDto } from './dto/create-dossier-jurisprudence.dto';
import { UpdateDossierJurisprudenceDto } from './dto/update-dossier-jurisprudence.dto';
import { QueryJurisprudenceDto } from './dto/query-jurisprudence.dto';
import {
  JurisprudenceResponse,
  DossierJurisprudenceResponse,
  JurisprudenceStatsResponse,
} from './interfaces/jurisprudence-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';

@Injectable()
export class JurisprudenceService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // -------------------- GESTION DES JURISPRUDENCES --------------------
  async createJurisprudence(
    createJurisprudenceDto: CreateJurisprudenceDto,
  ): Promise<JurisprudenceResponse> {
    const jurisprudence = await this.prisma.jurisprudence.create({
      data: createJurisprudenceDto,
    });

    // Invalider le cache
    await this.invalidateJurisprudencesCache();

    return this.formatJurisprudenceResponse(jurisprudence);
  }

  async findAllJurisprudences(query: QueryJurisprudenceDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'dateDecision',
      sortOrder = 'desc',
      juridiction,
      matiere,
      sensDecision,
      search,
      motsCles,
      dateDecisionMin,
      dateDecisionMax,
      dossierId,
    } = query;

    // Clé de cache pour cette requête
    const cacheKey = `jurisprudences:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Construire les filtres
    const where: any = {};

    if (juridiction) {
      where.juridiction = juridiction;
    }

    if (matiere) {
      where.matiere = matiere;
    }

    if (sensDecision) {
      where.sensDecision = sensDecision;
    }

    if (search) {
      where.OR = [
        { numeroArret: { contains: search, mode: 'insensitive' } },
        { parties: { contains: search, mode: 'insensitive' } },
        { resume: { contains: search, mode: 'insensitive' } },
        { texteIntegral: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (motsCles && motsCles.length > 0) {
      where.motsCles = {
        hasSome: motsCles,
      };
    }

    if (dateDecisionMin || dateDecisionMax) {
      where.dateDecision = {};
      if (dateDecisionMin) {
        where.dateDecision.gte = dateDecisionMin;
      }
      if (dateDecisionMax) {
        where.dateDecision.lte = dateDecisionMax;
      }
    }

    // Si dossierId est spécifié, on filtre les jurisprudences associées à ce dossier
    if (dossierId) {
      where.dossiers = {
        some: {
          dossierId,
        },
      };
    }

    // Obtenir les paramètres de pagination
    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Exécuter la requête
    const [jurisprudences, total] = await Promise.all([
      this.prisma.jurisprudence.findMany({
        where,
        ...paginationParams,
      }),
      this.prisma.jurisprudence.count({ where }),
    ]);

    // Formater les jurisprudences
    const formattedJurisprudences = await Promise.all(
      jurisprudences.map((jurisprudence) =>
        this.formatJurisprudenceResponse(jurisprudence),
      ),
    );

    // Formater la réponse
    const result = PaginationUtil.createPaginationResult(
      formattedJurisprudences,
      total,
      {
        page,
        limit,
        sortBy,
        sortOrder,
      },
    );

    // Mettre en cache pour 2 minutes
    await this.cacheManager.set(cacheKey, result, 120);

    return result;
  }

  async findOneJurisprudence(id: string): Promise<JurisprudenceResponse> {
    const cacheKey = `jurisprudence:${id}`;
    const cachedJurisprudence = await this.cacheManager.get(cacheKey);

    if (cachedJurisprudence) {
      return cachedJurisprudence as JurisprudenceResponse;
    }

    const jurisprudence = await this.prisma.jurisprudence.findUnique({
      where: { id },
    });

    if (!jurisprudence) {
      throw new NotFoundException(`Jurisprudence avec l'ID ${id} non trouvée`);
    }

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, jurisprudence, 300);

    return this.formatJurisprudenceResponse(jurisprudence);
  }

  async updateJurisprudence(
    id: string,
    updateJurisprudenceDto: UpdateJurisprudenceDto,
  ): Promise<JurisprudenceResponse> {
    // Vérifier si la jurisprudence existe
    const existingJurisprudence = await this.prisma.jurisprudence.findUnique({
      where: { id },
    });

    if (!existingJurisprudence) {
      throw new NotFoundException(`Jurisprudence avec l'ID ${id} non trouvée`);
    }

    // Mettre à jour la jurisprudence
    const updatedJurisprudence = await this.prisma.jurisprudence.update({
      where: { id },
      data: updateJurisprudenceDto,
    });

    // Invalider les caches
    await this.cacheManager.del(`jurisprudence:${id}`);
    await this.invalidateJurisprudencesCache();

    return this.formatJurisprudenceResponse(updatedJurisprudence);
  }

  async removeJurisprudence(id: string): Promise<void> {
    // Vérifier si la jurisprudence existe
    const existingJurisprudence = await this.prisma.jurisprudence.findUnique({
      where: { id },
    });

    if (!existingJurisprudence) {
      throw new NotFoundException(`Jurisprudence avec l'ID ${id} non trouvée`);
    }

    // Supprimer la jurisprudence
    await this.prisma.jurisprudence.delete({
      where: { id },
    });

    // Invalider les caches
    await this.cacheManager.del(`jurisprudence:${id}`);
    await this.invalidateJurisprudencesCache();
  }

  // -------------------- GESTION DES DOSSIERS-JURISPRUDENCES --------------------
  async createDossierJurisprudence(
    createDossierJurisprudenceDto: CreateDossierJurisprudenceDto,
  ): Promise<DossierJurisprudenceResponse> {
    const { dossierId, jurisprudenceId, pertinence, noteUtilisateur } =
      createDossierJurisprudenceDto;

    // Vérifier si le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
    });

    if (!dossier) {
      throw new NotFoundException(`Dossier avec l'ID ${dossierId} non trouvé`);
    }

    // Vérifier si la jurisprudence existe
    const jurisprudence = await this.prisma.jurisprudence.findUnique({
      where: { id: jurisprudenceId },
    });

    if (!jurisprudence) {
      throw new NotFoundException(
        `Jurisprudence avec l'ID ${jurisprudenceId} non trouvée`,
      );
    }

    // Vérifier si l'association existe déjà
    const existingAssociation =
      await this.prisma.dossierJurisprudence.findUnique({
        where: {
          dossierId_jurisprudenceId: {
            dossierId,
            jurisprudenceId,
          },
        },
      });

    if (existingAssociation) {
      throw new NotFoundException(
        `Cette jurisprudence est déjà associée à ce dossier`,
      );
    }

    // Créer l'association
    const dossierJurisprudence = await this.prisma.dossierJurisprudence.create({
      data: {
        dossierId,
        jurisprudenceId,
        pertinence,
        noteUtilisateur,
      },
      include: {
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            type: true,
            statut: true,
          },
        },
        jurisprudence: {
          select: {
            id: true,
            numeroArret: true,
            juridiction: true,
            dateDecision: true,
            matiere: true,
            resume: true,
          },
        },
      },
    });

    // Invalider les caches
    await this.invalidateJurisprudencesCache();

    return this.formatDossierJurisprudenceResponse(dossierJurisprudence);
  }

  async findAllDossiersJurisprudences(
    dossierId?: string,
    jurisprudenceId?: string,
  ) {
    const where: any = {};

    if (dossierId) {
      where.dossierId = dossierId;
    }

    if (jurisprudenceId) {
      where.jurisprudenceId = jurisprudenceId;
    }

    const dossierJurisprudences =
      await this.prisma.dossierJurisprudence.findMany({
        where,
        include: {
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
              type: true,
              statut: true,
            },
          },
          jurisprudence: {
            select: {
              id: true,
              numeroArret: true,
              juridiction: true,
              dateDecision: true,
              matiere: true,
              resume: true,
            },
          },
        },
      });

    return Promise.all(
      dossierJurisprudences.map((dossierJurisprudence) =>
        this.formatDossierJurisprudenceResponse(dossierJurisprudence),
      ),
    );
  }

  async findOneDossierJurisprudence(
    id: string,
  ): Promise<DossierJurisprudenceResponse> {
    const dossierJurisprudence =
      await this.prisma.dossierJurisprudence.findUnique({
        where: { id },
        include: {
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
              type: true,
              statut: true,
            },
          },
          jurisprudence: {
            select: {
              id: true,
              numeroArret: true,
              juridiction: true,
              dateDecision: true,
              matiere: true,
              resume: true,
            },
          },
        },
      });

    if (!dossierJurisprudence) {
      throw new NotFoundException(
        `Association dossier-jurisprudence avec l'ID ${id} non trouvée`,
      );
    }

    return this.formatDossierJurisprudenceResponse(dossierJurisprudence);
  }

  async updateDossierJurisprudence(
    id: string,
    updateDossierJurisprudenceDto: UpdateDossierJurisprudenceDto,
  ): Promise<DossierJurisprudenceResponse> {
    // Vérifier si l'association existe
    const existingDossierJurisprudence =
      await this.prisma.dossierJurisprudence.findUnique({
        where: { id },
      });

    if (!existingDossierJurisprudence) {
      throw new NotFoundException(
        `Association dossier-jurisprudence avec l'ID ${id} non trouvée`,
      );
    }

    // Mettre à jour l'association
    const updatedDossierJurisprudence =
      await this.prisma.dossierJurisprudence.update({
        where: { id },
        data: updateDossierJurisprudenceDto,
        include: {
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
              type: true,
              statut: true,
            },
          },
          jurisprudence: {
            select: {
              id: true,
              numeroArret: true,
              juridiction: true,
              dateDecision: true,
              matiere: true,
              resume: true,
            },
          },
        },
      });

    // Invalider les caches
    await this.invalidateJurisprudencesCache();

    return this.formatDossierJurisprudenceResponse(updatedDossierJurisprudence);
  }

  async removeDossierJurisprudence(id: string): Promise<void> {
    // Vérifier si l'association existe
    const existingDossierJurisprudence =
      await this.prisma.dossierJurisprudence.findUnique({
        where: { id },
      });

    if (!existingDossierJurisprudence) {
      throw new NotFoundException(
        `Association dossier-jurisprudence avec l'ID ${id} non trouvée`,
      );
    }

    // Supprimer l'association
    await this.prisma.dossierJurisprudence.delete({
      where: { id },
    });

    // Invalider les caches
    await this.invalidateJurisprudencesCache();
  }

  // -------------------- RECHERCHE ET RECOMMANDATIONS --------------------
  async searchJurisprudences(
    query: string,
    limit: number = 10,
  ): Promise<JurisprudenceResponse[]> {
    // Recherche plein texte
    const jurisprudences = await this.prisma.jurisprudence.findMany({
      where: {
        OR: [
          { numeroArret: { contains: query, mode: 'insensitive' } },
          { parties: { contains: query, mode: 'insensitive' } },
          { resume: { contains: query, mode: 'insensitive' } },
          { texteIntegral: { contains: query, mode: 'insensitive' } },
          { reference: { contains: query, mode: 'insensitive' } },
          { motsCles: { hasSome: [query] } },
        ],
      },
      take: limit,
      orderBy: { dateDecision: 'desc' },
    });

    return Promise.all(
      jurisprudences.map((jurisprudence) =>
        this.formatJurisprudenceResponse(jurisprudence),
      ),
    );
  }

  async getJurisprudencesSimilaires(
    jurisprudenceId: string,
    limit: number = 5,
  ): Promise<JurisprudenceResponse[]> {
    // Récupérer la jurisprudence de référence
    const jurisprudence = await this.prisma.jurisprudence.findUnique({
      where: { id: jurisprudenceId },
    });

    if (!jurisprudence) {
      throw new NotFoundException(
        `Jurisprudence avec l'ID ${jurisprudenceId} non trouvée`,
      );
    }

    // Chercher des jurisprudences similaires basées sur la matière et les mots-clés
    const jurisprudencesSimilaires = await this.prisma.jurisprudence.findMany({
      where: {
        AND: [
          { id: { not: jurisprudenceId } },
          { matiere: jurisprudence.matiere },
          {
            OR: [
              { motsCles: { hasSome: jurisprudence.motsCles } },
              { sensDecision: jurisprudence.sensDecision },
            ],
          },
        ],
      },
      take: limit,
      orderBy: { dateDecision: 'desc' },
    });

    return Promise.all(
      jurisprudencesSimilaires.map((j) => this.formatJurisprudenceResponse(j)),
    );
  }

  async getJurisprudencesRecommandees(
    dossierId: string,
    limit: number = 5,
  ): Promise<JurisprudenceResponse[]> {
    // Récupérer les informations du dossier
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
    });

    if (!dossier) {
      throw new NotFoundException(`Dossier avec l'ID ${dossierId} non trouvé`);
    }

    // Extraire des mots-clés du titre et de la description du dossier
    const motsClesDossier = [
      ...(dossier.titre?.split(' ') || []),
      ...(dossier.description?.split(' ') || []),
    ].filter((mot) => mot.length > 3); // Filtrer les mots courts

    // Chercher des jurisprudences pertinentes basées sur le type de dossier et les mots-clés
    const jurisprudencesRecommandees = await this.prisma.jurisprudence.findMany(
      {
        where: {
          AND: [
            {
              OR: [
                { motsCles: { hasSome: motsClesDossier } },
                { resume: { contains: dossier.titre, mode: 'insensitive' } },
              ],
            },
          ],
        },
        take: limit,
        orderBy: { dateDecision: 'desc' },
      },
    );

    return Promise.all(
      jurisprudencesRecommandees.map((j) =>
        this.formatJurisprudenceResponse(j),
      ),
    );
  }

  // -------------------- STATISTIQUES --------------------
  async getStats(): Promise<JurisprudenceStatsResponse> {
    const cacheKey = 'jurisprudences-stats';
    const cachedStats = await this.cacheManager.get(cacheKey);

    if (cachedStats) {
      return cachedStats as JurisprudenceStatsResponse;
    }

    // Récupérer les statistiques
    const [
      totalJurisprudences,
      jurisprudencesParJuridiction,
      jurisprudencesParMatiere,
      jurisprudencesParSensDecision,
      jurisprudencesRecentes,
    ] = await Promise.all([
      // Total des jurisprudences
      this.prisma.jurisprudence.count(),
      // Jurisprudences par juridiction
      this.prisma.jurisprudence.groupBy({
        by: ['juridiction'],
        _count: {
          id: true,
        },
      }),
      // Jurisprudences par matière
      this.prisma.jurisprudence.groupBy({
        by: ['matiere'],
        _count: {
          id: true,
        },
      }),
      // Jurisprudences par sens de décision
      this.prisma.jurisprudence.groupBy({
        by: ['sensDecision'],
        _count: {
          id: true,
        },
      }),
      // Jurisprudences récentes
      this.prisma.jurisprudence.findMany({
        orderBy: { creeLe: 'desc' },
        take: 5,
      }),
    ]);

    // Récupérer les mots-clés populaires
    const allJurisprudences = await this.prisma.jurisprudence.findMany({
      select: {
        motsCles: true,
      },
    });

    // Compter les mots-clés
    const motsClesCounts: { [key: string]: number } = {};
    allJurisprudences.forEach((j) => {
      j.motsCles.forEach((motCle) => {
        motsClesCounts[motCle] = (motsClesCounts[motCle] || 0) + 1;
      });
    });

    // Trier et prendre les 10 mots-clés les plus populaires
    const motsClesPopulaires = Object.entries(motsClesCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([motCle, count]) => ({ motCle, count }));

    // Formater les jurisprudences par juridiction
    const formattedJurisprudencesParJuridiction =
      jurisprudencesParJuridiction.map((item) => ({
        juridiction: item.juridiction,
        count: item._count.id,
      }));

    // Formater les jurisprudences par matière
    const formattedJurisprudencesParMatiere = jurisprudencesParMatiere.map(
      (item) => ({
        matiere: item.matiere,
        count: item._count.id,
      }),
    );

    // Formater les jurisprudences par sens de décision
    const formattedJurisprudencesParSensDecision =
      jurisprudencesParSensDecision.map((item) => ({
        sensDecision: item.sensDecision,
        count: item._count.id,
      }));

    // Formater les jurisprudences récentes
    const formattedJurisprudencesRecentes = await Promise.all(
      jurisprudencesRecentes.map((j) => this.formatJurisprudenceResponse(j)),
    );

    const stats: JurisprudenceStatsResponse = {
      totalJurisprudences,
      jurisprudencesParJuridiction: formattedJurisprudencesParJuridiction,
      jurisprudencesParMatiere: formattedJurisprudencesParMatiere,
      jurisprudencesParSensDecision: formattedJurisprudencesParSensDecision,
      jurisprudencesRecentes: formattedJurisprudencesRecentes,
      motsClesPopulaires,
    };

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300);

    return stats;
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private async formatJurisprudenceResponse(
    jurisprudence: any,
  ): Promise<JurisprudenceResponse> {
    // Calculer la pertinence moyenne et le nombre de dossiers associés
    const dossierJurisprudences =
      await this.prisma.dossierJurisprudence.findMany({
        where: { jurisprudenceId: jurisprudence.id },
        select: { pertinence: true },
      });

    const pertinenceMoyenne =
      dossierJurisprudences.length > 0
        ? dossierJurisprudences.reduce((sum, dj) => sum + dj.pertinence, 0) /
          dossierJurisprudences.length
        : undefined;

    const nombreDossiersAssocies = dossierJurisprudences.length;

    return {
      id: jurisprudence.id,
      numeroArret: jurisprudence.numeroArret,
      juridiction: jurisprudence.juridiction,
      dateDecision: jurisprudence.dateDecision,
      parties: jurisprudence.parties,
      matiere: jurisprudence.matiere,
      motsCles: jurisprudence.motsCles,
      resume: jurisprudence.resume,
      texteIntegral: jurisprudence.texteIntegral,
      sensDecision: jurisprudence.sensDecision,
      reference: jurisprudence.reference,
      documentUrl: jurisprudence.documentUrl,
      creeLe: jurisprudence.creeLe,
      modifieLe: jurisprudence.modifieLe,
      pertinenceMoyenne,
      nombreDossiersAssocies,
    };
  }

  private formatDossierJurisprudenceResponse(
    dossierJurisprudence: any,
  ): DossierJurisprudenceResponse {
    return {
      id: dossierJurisprudence.id,
      dossierId: dossierJurisprudence.dossierId,
      jurisprudenceId: dossierJurisprudence.jurisprudenceId,
      pertinence: dossierJurisprudence.pertinence,
      noteUtilisateur: dossierJurisprudence.noteUtilisateur,
      creeLe: dossierJurisprudence.creeLe,
      dossier: dossierJurisprudence.dossier,
      jurisprudence: dossierJurisprudence.jurisprudence,
    };
  }

  private async invalidateJurisprudencesCache(): Promise<void> {
    try {
      // Invalider tous les caches liés aux jurisprudences
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores) &&
        this.cacheManager.stores.length > 0
      ) {
        const store = this.cacheManager.stores[0];

        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('jurisprudences:*');
          const jurisprudenceKeys = await store.keys('jurisprudence:*');
          const statsKeys = await store.keys('jurisprudences-stats:*');

          const allKeys = [...keys, ...jurisprudenceKeys, ...statsKeys];

          if (
            allKeys.length > 0 &&
            'delete' in store &&
            typeof store.delete === 'function'
          ) {
            await Promise.all(allKeys.map((key) => store.delete(key)));
          }
        }
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'invalidation du cache des jurisprudences:",
        error,
      );
    }
  }
}
