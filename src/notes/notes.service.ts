/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import {
  NoteResponse,
  NoteStatsResponse,
} from './interfaces/note-response.interface';
import { StatutNote } from '@prisma/client';
import { PaginationUtil } from '../common/utils/pagination.util';
import { UsersService } from '../users/users.service';
import { QueryNotesDto } from './dto/filter-note.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  // -------------------- CRUD DE BASE --------------------
  async create(
    createNoteDto: CreateNoteDto,
    utilisateurId: string,
  ): Promise<NoteResponse> {
    const { titre, contenu, clientId, dossierId } = createNoteDto;

    // Validation : au moins un client ou un dossier doit être spécifié
    if (!clientId && !dossierId) {
      throw new Error('Une note doit être associée à un client ou un dossier');
    }

    // Vérifier si le client existe (si spécifié)
    if (clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new NotFoundException(`Client avec l'ID ${clientId} non trouvé`);
      }
    }

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

    // Créer la note
    const note = await this.prisma.note.create({
      data: {
        titre,
        contenu,
        clientId,
        dossierId,
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
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
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
    await this.invalidateNotesCache();

    return note as NoteResponse;
  }

  async findAll(query: QueryNotesDto): Promise<any> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'creeLe',
      sortOrder = 'desc',
      utilisateurId,
      clientId,
      dossierId,
      statut,
      typeCible,
      search,
    } = query;

    // Clé de cache pour cette requête
    const cacheKey = `notes:${JSON.stringify(query)}`;
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

    if (dossierId) {
      where.dossierId = dossierId;
    }

    if (statut) {
      where.statut = statut;
    }

    if (typeCible === 'client') {
      where.clientId = { not: null };
    } else if (typeCible === 'dossier') {
      where.dossierId = { not: null };
    }

    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } }, // Ajout de la parenthèse manquante
        { contenu: { contains: search, mode: 'insensitive' } }, // Ajout de la parenthèse manquante
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
    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
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
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
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
      this.prisma.note.count({ where }),
    ]);

    // Formater la réponse
    const result = PaginationUtil.createPaginationResult(notes, total, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  async findOne(id: string): Promise<NoteResponse> {
    const cacheKey = `note:${id}`;
    const cachedNote = await this.cacheManager.get(cacheKey);

    if (cachedNote) {
      return cachedNote as NoteResponse;
    }

    const note = await this.prisma.note.findUnique({
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
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
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

    if (!note) {
      throw new NotFoundException(`Note avec l'ID ${id} non trouvée`);
    }

    // Mettre en cache pour 10 minutes
    await this.cacheManager.set(cacheKey, note, 600);

    return note as NoteResponse;
  }

  async update(
    id: string,
    updateNoteDto: UpdateNoteDto,
    @CurrentUser('id') userId: string,
  ): Promise<NoteResponse> {
    // Vérifier si la note existe
    const existingNote = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!existingNote) {
      throw new NotFoundException(`Note avec l'ID ${id} non trouvée`);
    }

    // Validation : au moins un client ou un dossier doit être spécifié
    const { clientId, dossierId } = updateNoteDto;
    if (
      clientId === null &&
      dossierId === null &&
      !existingNote.clientId &&
      !existingNote.dossierId
    ) {
      throw new Error('Une note doit être associée à un client ou un dossier');
    }

    // Vérifier si le client existe (si spécifié)
    if (clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new NotFoundException(`Client avec l'ID ${clientId} non trouvé`);
      }
    }

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

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (updateNoteDto.titre !== undefined) {
      updateData.titre = updateNoteDto.titre;
    }
    if (updateNoteDto.contenu !== undefined) {
      updateData.contenu = updateNoteDto.contenu;
    }
    if (updateNoteDto.clientId !== undefined) {
      updateData.clientId = updateNoteDto.clientId;
    }
    if (updateNoteDto.dossierId !== undefined) {
      // Correction ici
      updateData.dossierId = updateNoteDto.dossierId; // Correction ici
    }
    if (updateNoteDto.statut !== undefined) {
      // Correction ici
      updateData.statut = updateNoteDto.statut; // Correction ici
    }

    // Mettre à jour la note
    const updatedNote = await this.prisma.note.update({
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
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
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
    await this.cacheManager.del(`note:${id}`);
    await this.invalidateNotesCache();

    return updatedNote as NoteResponse;
  }

  async remove(id: string): Promise<void> {
    // Vérifier si la note existe
    const existingNote = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!existingNote) {
      throw new NotFoundException(`Note avec l'ID ${id} non trouvée`);
    }

    // Supprimer la note
    await this.prisma.note.delete({
      where: { id },
    });

    // Invalider les caches
    await this.cacheManager.del(`note:${id}`);
    await this.invalidateNotesCache();
  }

  // -------------------- MÉTHODES SPÉCIFIQUES --------------------
  async getNotesByClient(clientId: string, query: QueryNotesDto) {
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

  async getNotesByDossier(dossierId: string, query: QueryNotesDto) {
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

  async getNotesByUtilisateur(utilisateurId: string, query: QueryNotesDto) {
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

  async getStats(utilisateurId?: string): Promise<NoteStatsResponse> {
    const cacheKey = `notes-stats:${utilisateurId || 'global'}`;
    let cachedStats = await this.cacheManager.get(cacheKey);

    if (cachedStats) {
      return cachedStats as NoteStatsResponse;
    }

    // Construire les filtres
    const where: any = {};
    if (utilisateurId) {
      where.utilisateurId = utilisateurId;
    }

    // Récupérer les statistiques
    const [
      totalNotes,
      notesClient,
      notesDossier,
      notesActives,
      notesSupprimees,
      recentes,
    ] = await Promise.all([
      // Total des notes
      this.prisma.note.count({ where }),
      // Notes par type
      this.prisma.note.count({
        where: { ...where, clientId: { not: null } },
      }),
      this.prisma.note.count({
        where: { ...where, dossierId: { not: null } },
      }),
      // Notes par statut
      this.prisma.note.count({
        where: { ...where, statut: StatutNote.ACTIF },
      }),
      this.prisma.note.count({
        where: { ...where, statut: StatutNote.SUPPRIME },
      }),
      // Notes récentes
      this.prisma.note.findMany({
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
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
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

    const stats: NoteStatsResponse = {
      total: totalNotes,
      parType: {
        client: notesClient,
        dossier: notesDossier,
      },
      parStatut: {
        actif: notesActives,
        supprime: notesSupprimees,
      },
      recentes: recentes as NoteResponse[],
    };

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300);

    return stats;
  }

  async searchNotes(searchTerm: string, query: QueryNotesDto) {
    // Utiliser findAll avec le terme de recherche
    return this.findAll({
      ...query,
      search: searchTerm,
    });
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private async invalidateNotesCache(): Promise<void> {
    try {
      // Invalider tous les caches liés aux notes
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores) &&
        this.cacheManager.stores.length > 0
      ) {
        const store = this.cacheManager.stores[0];

        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('notes:*');
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
        "❌ Erreur lors de l'invalidation du cache des notes:",
        error,
      );
    }
  }
}
