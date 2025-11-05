/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateCorrespondanceDto } from './dto/create-correspondance.dto';
import { UpdateCorrespondanceDto } from './dto/update-correspondance.dto';
import {
  CorrespondanceResponse,
  CorrespondanceStatsResponse,
} from './interfaces/correspondance-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { UsersService } from '../users/users.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { QueryCorrespondanceDto } from './dto/filter-correspondances.dto';

@Injectable()
export class CorrespondanceService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  // -------------------- CRUD DE BASE --------------------
  async create(
    createCorrespondanceDto: CreateCorrespondanceDto,
    utilisateurId: string,
  ): Promise<CorrespondanceResponse> {
    const { type, contenu, clientId } = createCorrespondanceDto;

    // Validation : un client doit être spécifié
    if (!clientId) {
      throw new Error('Une correspondance doit être associée à un client');
    }

    // Vérifier si le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client avec l'ID ${clientId} non trouvé`);
    }

    // Créer la correspondance
    const correspondance = await this.prisma.correspondance.create({
      data: {
        type,
        contenu,
        clientId,
        utilisateurId,
      },
      include: {
        client: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            entreprise: true,
          },
        },
        utilisateur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
          },
        },
      },
    });

    // Invalider le cache
    await this.invalidateCorrespondancesCache();

    return correspondance as CorrespondanceResponse;
  }

  async findAll(query: QueryCorrespondanceDto): Promise<any> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'creeLe',
      sortOrder = 'desc',
      utilisateurId,
      clientId,
      type,
      statut,
      search,
    } = query;

    // Clé de cache pour cette requête
    const cacheKey = `correspondances:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Construire les filtres
    const where: any = {};

    if (utilisateurId) {
      where.utilisateurId = utilisateurId;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (type) {
      where.type = type;
    }

    if (statut) {
      where.statut = statut;
    }

    if (search) {
      where.OR = [{ contenu: { contains: search, mode: 'insensitive' } }];
    }

    // Obtenir les paramètres de pagination
    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Exécuter la requête
    const [correspondances, total] = await Promise.all([
      this.prisma.correspondance.findMany({
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
          utilisateur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
            },
          },
        },
      }),
      this.prisma.correspondance.count({ where }),
    ]);

    // Formater la réponse
    const result = PaginationUtil.createPaginationResult(
      correspondances,
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

  async findOne(id: string): Promise<CorrespondanceResponse> {
    const cacheKey = `correspondance:${id}`;
    const cachedCorrespondance = await this.cacheManager.get(cacheKey);

    if (cachedCorrespondance) {
      return cachedCorrespondance as CorrespondanceResponse;
    }

    const correspondance = await this.prisma.correspondance.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            entreprise: true,
          },
        },
        utilisateur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
          },
        },
      },
    });

    if (!correspondance) {
      throw new NotFoundException(`Correspondance avec l'ID ${id} non trouvée`);
    }

    // Mettre en cache pour 10 minutes
    await this.cacheManager.set(cacheKey, correspondance, 600);

    return correspondance as CorrespondanceResponse;
  }

  async update(
    id: string,
    updateCorrespondanceDto: UpdateCorrespondanceDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @CurrentUser('id') userId: string,
  ): Promise<CorrespondanceResponse> {
    // Vérifier si la correspondance existe
    const existingCorrespondance = await this.prisma.correspondance.findUnique({
      where: { id },
    });

    if (!existingCorrespondance) {
      throw new NotFoundException(`Correspondance avec l'ID ${id} non trouvée`);
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (updateCorrespondanceDto.type !== undefined) {
      updateData.type = updateCorrespondanceDto.type;
    }
    if (updateCorrespondanceDto.contenu !== undefined) {
      updateData.contenu = updateCorrespondanceDto.contenu;
    }
    if (updateCorrespondanceDto.statut !== undefined) {
      updateData.statut = updateCorrespondanceDto.statut;
    }

    // Mettre à jour la correspondance
    const updatedCorrespondance = await this.prisma.correspondance.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            entreprise: true,
          },
        },
        utilisateur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
          },
        },
      },
    });

    // Invalider les caches
    await this.cacheManager.del(`correspondance:${id}`);
    await this.invalidateCorrespondancesCache();

    return updatedCorrespondance as CorrespondanceResponse;
  }

  async remove(id: string): Promise<void> {
    // Vérifier si la correspondance existe
    const existingCorrespondance = await this.prisma.correspondance.findUnique({
      where: { id },
    });

    if (!existingCorrespondance) {
      throw new NotFoundException(`Correspondance avec l'ID ${id} non trouvée`);
    }

    // Supprimer la correspondance
    await this.prisma.correspondance.delete({
      where: { id },
    });

    // Invalider les caches
    await this.cacheManager.del(`correspondance:${id}`);
    await this.invalidateCorrespondancesCache();
  }

  // -------------------- MÉTHODES SPÉCIFIQUES --------------------
  async getCorrespondancesByClient(
    clientId: string,
    query: QueryCorrespondanceDto,
  ) {
    // Vérifier si le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client avec l'ID ${clientId} non trouvé`);
    }

    // Utiliser findAll avec le filtre clientId
    return this.findAll({
      ...query,
      clientId,
    });
  }

  async getCorrespondancesByUtilisateur(
    utilisateurId: string,
    query: QueryCorrespondanceDto,
  ) {
    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });

    if (!utilisateur) {
      throw new NotFoundException(
        `Utilisateur avec l'ID ${utilisateurId} non trouvé`,
      );
    }

    // Utiliser findAll avec le filtre utilisateurId
    return this.findAll({
      ...query,
      utilisateurId,
    });
  }

  async getStats(utilisateurId?: string): Promise<CorrespondanceStatsResponse> {
    const cacheKey = `correspondances-stats:${utilisateurId || 'global'}`;
    let cachedStats = await this.cacheManager.get(cacheKey);

    if (cachedStats) {
      return cachedStats as CorrespondanceStatsResponse;
    }

    // Construire les filtres
    const where: any = {};
    if (utilisateurId) {
      where.utilisateurId = utilisateurId;
    }

    // Récupérer les statistiques
    const [
      totalCorrespondances,
      correspondancesParType,
      correspondancesParStatut,
      recentes,
    ] = await Promise.all([
      // Total des correspondances
      this.prisma.correspondance.count({ where }),
      // Correspondances par type
      this.prisma.correspondance.groupBy({
        by: ['type'],
        where,
        _count: {
          type: true,
        },
      }),
      // Correspondances par statut
      this.prisma.correspondance.groupBy({
        by: ['statut'],
        where,
        _count: {
          statut: true,
        },
      }),
      // Correspondances récentes
      this.prisma.correspondance.findMany({
        where,
        orderBy: { creeLe: 'desc' },
        take: 5,
        include: {
          client: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              entreprise: true,
            },
          },
          utilisateur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
            },
          },
        },
      }),
    ]);

    // Formater les statistiques par type
    const parType: { [key: string]: number } = {};
    correspondancesParType.forEach((item) => {
      parType[item.type] = item._count.type;
    });

    // Formater les statistiques par statut
    const parStatut: { [key: string]: number } = {};
    correspondancesParStatut.forEach((item) => {
      parStatut[item.statut] = item._count.statut;
    });

    const stats: CorrespondanceStatsResponse = {
      total: totalCorrespondances,
      parType,
      parStatut,
      recentes: recentes as CorrespondanceResponse[],
    };

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300);

    return stats;
  }

  async searchCorrespondances(
    searchTerm: string,
    query: QueryCorrespondanceDto,
  ) {
    // Utiliser findAll avec le terme de recherche
    return this.findAll({
      ...query,
      search: searchTerm,
    });
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private async invalidateCorrespondancesCache(): Promise<void> {
    try {
      // Invalider tous les caches liés aux correspondances
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores) &&
        this.cacheManager.stores.length > 0
      ) {
        const store = this.cacheManager.stores[0];

        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('correspondances:*');
          if (keys.length > 0) {
            if ('delete' in store && typeof store.delete === 'function') {
              await Promise.all(keys.map((key) => store.delete(key)));
            }
          }
        }
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'invalidation du cache des correspondances:",
        error,
      );
    }
  }
}
