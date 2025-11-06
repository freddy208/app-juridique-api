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
import { CreateCommentaireDto } from './dto/create-commentaire.dto';
import { UpdateCommentaireDto } from './dto/update-commentaire.dto';
import {
  CommentaireResponse,
  CommentaireStatsResponse,
} from './interfaces/commentaire-response.interface';
import { StatutCommentaire } from '@prisma/client';
import { PaginationUtil } from '../common/utils/pagination.util';
import { UsersService } from '../users/users.service';
import { QueryCommentairesDto } from './dto/query-commentaires.dto';

@Injectable()
export class CommentairesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  // -------------------- CRUD DE BASE --------------------
  async create(
    createCommentaireDto: CreateCommentaireDto,
    utilisateurId: string,
  ): Promise<CommentaireResponse> {
    const { contenu, documentId, tacheId } = createCommentaireDto;

    // Validation : au moins un document ou une tâche doit être spécifié
    if (!documentId && !tacheId) {
      throw new Error(
        'Un commentaire doit être associé à un document ou une tâche',
      );
    }

    // Vérifier si le document existe (si spécifié)
    if (documentId) {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new NotFoundException(
          `Document avec l'ID ${documentId} non trouvé`,
        );
      }
    }

    // Vérifier si la tâche existe (si spécifiée)
    if (tacheId) {
      const tache = await this.prisma.tache.findUnique({
        where: { id: tacheId },
      });

      if (!tache) {
        throw new NotFoundException(`Tâche avec l'ID ${tacheId} non trouvée`);
      }
    }

    // Créer le commentaire
    const commentaire = await this.prisma.commentaire.create({
      data: {
        contenu,
        documentId,
        tacheId,
        utilisateurId,
      },
      include: {
        utilisateur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
          },
        },
        document: {
          select: {
            id: true,
            titre: true,
            type: true,
          },
        },
        tache: {
          select: {
            id: true,
            titre: true,
            statut: true,
          },
        },
      },
    });

    // Invalider le cache
    await this.invalidateCommentairesCache();

    return commentaire as CommentaireResponse;
  }

  async findAll(query: QueryCommentairesDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'creeLe',
      sortOrder = 'desc',
      utilisateurId,
      documentId,
      tacheId,
      statut,
      search,
    } = query;

    // Clé de cache pour cette requête
    const cacheKey = `commentaires:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Construire les filtres
    const where: any = {};

    if (utilisateurId) {
      where.utilisateurId = utilisateurId;
    }

    if (documentId) {
      where.documentId = documentId;
    }

    if (tacheId) {
      where.tacheId = tacheId;
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
    const [commentaires, total] = await Promise.all([
      this.prisma.commentaire.findMany({
        where,
        ...paginationParams,
        include: {
          utilisateur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
            },
          },
          document: {
            select: {
              id: true,
              titre: true,
              type: true,
            },
          },
          tache: {
            select: {
              id: true,
              titre: true,
              statut: true,
            },
          },
        },
      }),
      this.prisma.commentaire.count({ where }),
    ]);

    // Formater la réponse
    const result = PaginationUtil.createPaginationResult(commentaires, total, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  async findOne(id: string): Promise<CommentaireResponse> {
    const cacheKey = `commentaire:${id}`;
    const cachedCommentaire = await this.cacheManager.get(cacheKey);

    if (cachedCommentaire) {
      return cachedCommentaire as CommentaireResponse;
    }

    const commentaire = await this.prisma.commentaire.findUnique({
      where: { id },
      include: {
        utilisateur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
          },
        },
        document: {
          select: {
            id: true,
            titre: true,
            type: true,
          },
        },
        tache: {
          select: {
            id: true,
            titre: true,
            statut: true,
          },
        },
      },
    });

    if (!commentaire) {
      throw new NotFoundException(`Commentaire avec l'ID ${id} non trouvé`);
    }

    // Mettre en cache pour 10 minutes
    await this.cacheManager.set(cacheKey, commentaire, 600);

    return commentaire as CommentaireResponse;
  }

  async update(
    id: string,
    updateCommentaireDto: UpdateCommentaireDto,
  ): Promise<CommentaireResponse> {
    // Vérifier si le commentaire existe
    const existingCommentaire = await this.prisma.commentaire.findUnique({
      where: { id },
    });

    if (!existingCommentaire) {
      throw new NotFoundException(`Commentaire avec l'ID ${id} non trouvé`);
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (updateCommentaireDto.contenu !== undefined) {
      updateData.contenu = updateCommentaireDto.contenu;
    }
    if (updateCommentaireDto.statut !== undefined) {
      updateData.statut = updateCommentaireDto.statut;
    }

    // Mettre à jour le commentaire
    const updatedCommentaire = await this.prisma.commentaire.update({
      where: { id },
      data: updateData,
      include: {
        utilisateur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
          },
        },
        document: {
          select: {
            id: true,
            titre: true,
            type: true,
          },
        },
        tache: {
          select: {
            id: true,
            titre: true,
            statut: true,
          },
        },
      },
    });

    // Invalider les caches
    await this.cacheManager.del(`commentaire:${id}`);
    await this.invalidateCommentairesCache();

    return updatedCommentaire as CommentaireResponse;
  }

  async remove(id: string): Promise<void> {
    // Vérifier si le commentaire existe
    const existingCommentaire = await this.prisma.commentaire.findUnique({
      where: { id },
    });

    if (!existingCommentaire) {
      throw new NotFoundException(`Commentaire avec l'ID ${id} non trouvé`);
    }

    // Supprimer le commentaire
    await this.prisma.commentaire.delete({
      where: { id },
    });

    // Invalider les caches
    await this.cacheManager.del(`commentaire:${id}`);
    await this.invalidateCommentairesCache();
  }

  // -------------------- MÉTHODES SPÉCIFIQUES --------------------
  async getCommentairesByDocument(
    documentId: string,
    query: QueryCommentairesDto,
  ) {
    // Vérifier si le document existe
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(
        `Document avec l'ID ${documentId} non trouvé`,
      );
    }

    // Utiliser findAll avec le filtre documentId
    return this.findAll({
      ...query,
      documentId,
    });
  }

  async getCommentairesByTache(tacheId: string, query: QueryCommentairesDto) {
    // Vérifier si la tâche existe
    const tache = await this.prisma.tache.findUnique({
      where: { id: tacheId },
    });

    if (!tache) {
      throw new NotFoundException(`Tâche avec l'ID ${tacheId} non trouvée`);
    }

    // Utiliser findAll avec le filtre tacheId
    return this.findAll({
      ...query,
      tacheId,
    });
  }

  async getCommentairesByUtilisateur(
    utilisateurId: string,
    query: QueryCommentairesDto,
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

  async getStats(utilisateurId?: string): Promise<CommentaireStatsResponse> {
    const cacheKey = `commentaires-stats:${utilisateurId || 'global'}`;
    const cachedStats = await this.cacheManager.get(cacheKey);

    if (cachedStats) {
      return cachedStats as CommentaireStatsResponse;
    }

    // Construire les filtres
    const where: any = {};
    if (utilisateurId) {
      where.utilisateurId = utilisateurId;
    }

    // Récupérer les statistiques
    const [
      total,
      commentairesDocument,
      commentairesTache,
      commentairesActifs,
      commentairesSupprimes,
      recentes,
    ] = await Promise.all([
      // Total des commentaires
      this.prisma.commentaire.count({ where }),
      // Commentaires par type
      this.prisma.commentaire.count({
        where: { ...where, documentId: { not: null } },
      }),
      this.prisma.commentaire.count({
        where: { ...where, tacheId: { not: null } },
      }),
      // Commentaires par statut
      this.prisma.commentaire.count({
        where: { ...where, statut: StatutCommentaire.ACTIF },
      }),
      this.prisma.commentaire.count({
        where: { ...where, statut: StatutCommentaire.SUPPRIME },
      }),
      // Commentaires récents
      this.prisma.commentaire.findMany({
        where,
        orderBy: { creeLe: 'desc' },
        take: 5,
        include: {
          utilisateur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
            },
          },
          document: {
            select: {
              id: true,
              titre: true,
              type: true,
            },
          },
          tache: {
            select: {
              id: true,
              titre: true,
              statut: true,
            },
          },
        },
      }),
    ]);

    const stats: CommentaireStatsResponse = {
      total,
      parStatut: {
        actif: commentairesActifs,
        supprime: commentairesSupprimes,
      },
      parType: {
        document: commentairesDocument,
        tache: commentairesTache,
      },
      recentes: recentes as CommentaireResponse[],
    };

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300);

    return stats;
  }

  async searchCommentaires(searchTerm: string, query: QueryCommentairesDto) {
    // Utiliser findAll avec le terme de recherche
    return this.findAll({
      ...query,
      search: searchTerm,
    });
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private async invalidateCommentairesCache(): Promise<void> {
    try {
      // Invalider tous les caches liés aux commentaires
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores) &&
        this.cacheManager.stores.length > 0
      ) {
        const store = this.cacheManager.stores[0];

        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('commentaires:*');
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
        "❌ Erreur lors de l'invalidation du cache des commentaires:",
        error,
      );
    }
  }
}
