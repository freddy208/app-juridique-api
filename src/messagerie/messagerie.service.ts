/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { UpdateDiscussionDto } from './dto/update-discussion.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';
import {
  DiscussionResponse,
  MessageResponse,
  MessagerieStatsResponse,
} from './interfaces/discussion-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { UsersService } from '../users/users.service';
import { QueryDiscussionsDto } from './dto/query-discussions.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagerieService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  // -------------------- GESTION DES DISCUSSIONS --------------------
  async createDiscussion(
    createDiscussionDto: CreateDiscussionDto,
    createurId: string,
  ): Promise<DiscussionResponse> {
    const { titre, dossierId, participantsIds, messageInitial } =
      createDiscussionDto;

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

    // Vérifier si les participants existent (si spécifiés)
    if (participantsIds && participantsIds.length > 0) {
      const utilisateurs = await this.prisma.utilisateur.findMany({
        where: { id: { in: participantsIds } },
      });

      if (utilisateurs.length !== participantsIds.length) {
        throw new NotFoundException('Un ou plusieurs participants non trouvés');
      }
    }

    // Créer la discussion
    const discussion = await this.prisma.discussion.create({
      data: {
        titre,
        dossierId,
        createurId,
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

    // Ajouter le message initial (si spécifié)
    if (messageInitial) {
      await this.prisma.messageChat.create({
        data: {
          discussionId: discussion.id,
          expediteurId: createurId,
          contenu: messageInitial,
        },
      });
    }

    // Envoyer des notifications aux participants (si spécifiés)
    if (participantsIds && participantsIds.length > 0) {
      await Promise.all(
        participantsIds.map((participantId) =>
          this.notificationsService.create({
            utilisateurId: participantId,
            titre: 'Nouvelle discussion',
            message: `Vous avez été ajouté à la discussion: ${titre || 'Sans titre'}`,
            type: 'MESSAGE',
            lien: `/messagerie/discussions/${discussion.id}`,
          }),
        ),
      );
    }

    // Invalider le cache
    await this.invalidateMessagerieCache();

    return this.formatDiscussionResponse(discussion, createurId);
  }

  async findAllDiscussions(query: QueryDiscussionsDto, utilisateurId: string) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'modifieLe',
      sortOrder = 'desc',
      createurId,
      dossierId,
      participantId,
      statut,
      search,
      nonLuesSeulement,
      avecMessagesNonLus,
    } = query;

    // Clé de cache pour cette requête
    const cacheKey = `discussions:${utilisateurId}:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Construire les filtres
    const where: any = {};

    if (createurId) {
      where.createurId = createurId;
    }

    if (dossierId) {
      where.dossierId = dossierId;
    }

    if (statut) {
      where.statut = statut;
    }

    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        {
          messages: {
            some: { contenu: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    // Filtrer par discussions où l'utilisateur est le créateur ou a envoyé un message
    where.OR = [
      { createurId: utilisateurId },
      {
        messages: {
          some: {
            expediteurId: utilisateurId,
          },
        },
      },
    ];

    // Filtrer par participant spécifique
    if (participantId) {
      where.OR = [
        { createurId: participantId },
        {
          messages: {
            some: {
              expediteurId: participantId,
            },
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
    const [discussions, total] = await Promise.all([
      this.prisma.discussion.findMany({
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
          messages: {
            orderBy: { creeLe: 'desc' },
            take: 1,
            include: {
              expediteur: {
                select: {
                  id: true,
                  prenom: true,
                  nom: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      }),
      this.prisma.discussion.count({ where }),
    ]);

    // Formater les discussions
    const formattedDiscussions = await Promise.all(
      discussions.map((discussion) =>
        this.formatDiscussionResponse(discussion, utilisateurId),
      ),
    );

    // Formater la réponse
    const result = PaginationUtil.createPaginationResult(
      formattedDiscussions,
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

  async findOneDiscussion(
    id: string,
    utilisateurId: string,
  ): Promise<DiscussionResponse> {
    const cacheKey = `discussion:${id}:${utilisateurId}`;
    const cachedDiscussion = await this.cacheManager.get(cacheKey);

    if (cachedDiscussion) {
      return cachedDiscussion as DiscussionResponse;
    }

    const discussion = await this.prisma.discussion.findUnique({
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
        messages: {
          orderBy: { creeLe: 'desc' },
          take: 1,
          include: {
            expediteur: {
              select: {
                id: true,
                prenom: true,
                nom: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!discussion) {
      throw new NotFoundException(`Discussion avec l'ID ${id} non trouvée`);
    }

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, discussion, 300);

    return this.formatDiscussionResponse(discussion, utilisateurId);
  }

  async updateDiscussion(
    id: string,
    updateDiscussionDto: UpdateDiscussionDto,
    utilisateurId: string,
  ): Promise<DiscussionResponse> {
    // Vérifier si la discussion existe
    const existingDiscussion = await this.prisma.discussion.findUnique({
      where: { id },
    });

    if (!existingDiscussion) {
      throw new NotFoundException(`Discussion avec l'ID ${id} non trouvée`);
    }

    // Vérifier si l'utilisateur est le créateur
    if (existingDiscussion.createurId !== utilisateurId) {
      throw new NotFoundException(`Discussion avec l'ID ${id} non trouvée`);
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (updateDiscussionDto.titre !== undefined) {
      updateData.titre = updateDiscussionDto.titre;
    }
    if (updateDiscussionDto.statut !== undefined) {
      updateData.statut = updateDiscussionDto.statut;
    }

    // Mettre à jour la discussion
    const updatedDiscussion = await this.prisma.discussion.update({
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
        messages: {
          orderBy: { creeLe: 'desc' },
          take: 1,
          include: {
            expediteur: {
              select: {
                id: true,
                prenom: true,
                nom: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    // Invalider les caches
    await this.cacheManager.del(`discussion:${id}:${utilisateurId}`);
    await this.invalidateMessagerieCache();

    return this.formatDiscussionResponse(updatedDiscussion, utilisateurId);
  }

  async removeDiscussion(id: string, utilisateurId: string): Promise<void> {
    // Vérifier si la discussion existe
    const existingDiscussion = await this.prisma.discussion.findUnique({
      where: { id },
    });

    if (!existingDiscussion) {
      throw new NotFoundException(`Discussion avec l'ID ${id} non trouvée`);
    }

    // Vérifier si l'utilisateur est le créateur
    if (existingDiscussion.createurId !== utilisateurId) {
      throw new NotFoundException(`Discussion avec l'ID ${id} non trouvée`);
    }

    // Supprimer la discussion
    await this.prisma.discussion.delete({
      where: { id },
    });

    // Invalider les caches
    await this.cacheManager.del(`discussion:${id}:${utilisateurId}`);
    await this.invalidateMessagerieCache();
  }

  // -------------------- GESTION DES MESSAGES --------------------
  async createMessage(
    createMessageDto: CreateMessageDto,
    expediteurId: string,
  ): Promise<MessageResponse> {
    const { discussionId, contenu, fichiersIds } = createMessageDto;

    // Vérifier si la discussion existe
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) {
      throw new NotFoundException(
        `Discussion avec l'ID ${discussionId} non trouvée`,
      );
    }

    // Créer le message
    const message = await this.prisma.messageChat.create({
      data: {
        discussionId,
        expediteurId,
        contenu,
      },
      include: {
        expediteur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
        discussion: {
          select: {
            id: true,
            titre: true,
          },
        },
      },
    });

    // Mettre à jour la date de modification de la discussion
    await this.prisma.discussion.update({
      where: { id: discussionId },
      data: { modifieLe: new Date() },
    });

    // Envoyer une notification au créateur de la discussion (si différent de l'expéditeur)
    if (discussion.createurId !== expediteurId) {
      await this.notificationsService.create({
        utilisateurId: discussion.createurId,
        titre: 'Nouveau message',
        message: `Nouveau message dans la discussion: ${discussion.titre || 'Sans titre'}`,
        type: 'MESSAGE',
        lien: `/messagerie/discussions/${discussionId}`,
      });
    }

    // Invalider les caches
    await this.invalidateMessagerieCache();

    return this.formatMessageResponse(message, expediteurId);
  }

  async findAllMessages(query: QueryMessagesDto, utilisateurId: string) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'creeLe',
      sortOrder = 'asc',
      discussionId,
      expediteurId,
      statut,
      dateMin,
      dateMax,
      search,
      nonLusSeulement,
    } = query;

    // Clé de cache pour cette requête
    const cacheKey = `messages:${utilisateurId}:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Construire les filtres
    const where: any = {};

    if (discussionId) {
      where.discussionId = discussionId;
    } else {
      // Si aucune discussion spécifiée, filtrer par discussions où l'utilisateur est le créateur ou a envoyé un message
      where.discussion = {
        OR: [
          { createurId: utilisateurId },
          {
            messages: {
              some: {
                expediteurId: utilisateurId,
              },
            },
          },
        ],
      };
    }

    if (expediteurId) {
      where.expediteurId = expediteurId;
    }

    if (statut) {
      where.statut = statut;
    }

    if (dateMin || dateMax) {
      where.creeLe = {};
      if (dateMin) {
        where.creeLe.gte = dateMin;
      }
      if (dateMax) {
        where.creeLe.lte = dateMax;
      }
    }

    if (search) {
      where.contenu = { contains: search, mode: 'insensitive' };
    }

    // Filtrer par messages non lus (pas implémenté avec le schéma actuel)
    if (nonLusSeulement) {
      where.expediteurId = { not: utilisateurId };
    }

    // Obtenir les paramètres de pagination
    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Exécuter la requête
    const [messages, total] = await Promise.all([
      this.prisma.messageChat.findMany({
        where,
        ...paginationParams,
        include: {
          expediteur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              role: true,
            },
          },
          discussion: {
            select: {
              id: true,
              titre: true,
            },
          },
        },
      }),
      this.prisma.messageChat.count({ where }),
    ]);

    // Formater les messages
    const formattedMessages = await Promise.all(
      messages.map((message) =>
        this.formatMessageResponse(message, utilisateurId),
      ),
    );

    // Formater la réponse
    const result = PaginationUtil.createPaginationResult(
      formattedMessages,
      total,
      {
        page,
        limit,
        sortBy,
        sortOrder,
      },
    );

    // Mettre en cache pour 1 minute
    await this.cacheManager.set(cacheKey, result, 60);

    return result;
  }

  async findOneMessage(
    id: string,
    utilisateurId: string,
  ): Promise<MessageResponse> {
    const cacheKey = `message:${id}:${utilisateurId}`;
    const cachedMessage = await this.cacheManager.get(cacheKey);

    if (cachedMessage) {
      return cachedMessage as MessageResponse;
    }

    const message = await this.prisma.messageChat.findUnique({
      where: { id },
      include: {
        expediteur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
        discussion: {
          select: {
            id: true,
            titre: true,
            createurId: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException(`Message avec l'ID ${id} non trouvé`);
    }

    // Vérifier si l'utilisateur a accès à la discussion (créateur ou a envoyé un message)
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: message.discussionId },
      include: {
        messages: {
          where: {
            expediteurId: utilisateurId,
          },
          take: 1,
        },
      },
    });

    if (
      !discussion ||
      (discussion.createurId !== utilisateurId &&
        discussion.messages.length === 0)
    ) {
      throw new NotFoundException(`Message avec l'ID ${id} non trouvé`);
    }

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, message, 300);

    return this.formatMessageResponse(message, utilisateurId);
  }

  async updateMessage(
    id: string,
    updateMessageDto: UpdateMessageDto,
    utilisateurId: string,
  ): Promise<MessageResponse> {
    // Vérifier si le message existe
    const existingMessage = await this.prisma.messageChat.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      throw new NotFoundException(`Message avec l'ID ${id} non trouvé`);
    }

    // Vérifier si l'utilisateur est l'expéditeur du message
    if (existingMessage.expediteurId !== utilisateurId) {
      throw new NotFoundException(`Message avec l'ID ${id} non trouvé`);
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (updateMessageDto.contenu !== undefined) {
      updateData.contenu = updateMessageDto.contenu;
    }
    if (updateMessageDto.statut !== undefined) {
      updateData.statut = updateMessageDto.statut;
    }

    // Mettre à jour le message
    const updatedMessage = await this.prisma.messageChat.update({
      where: { id },
      data: updateData,
      include: {
        expediteur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
        discussion: {
          select: {
            id: true,
            titre: true,
          },
        },
      },
    });

    // Invalider les caches
    await this.cacheManager.del(`message:${id}:${utilisateurId}`);
    await this.invalidateMessagerieCache();

    return this.formatMessageResponse(updatedMessage, utilisateurId);
  }

  async removeMessage(id: string, utilisateurId: string): Promise<void> {
    // Vérifier si le message existe
    const existingMessage = await this.prisma.messageChat.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      throw new NotFoundException(`Message avec l'ID ${id} non trouvé`);
    }

    // Vérifier si l'utilisateur est l'expéditeur du message
    if (existingMessage.expediteurId !== utilisateurId) {
      throw new NotFoundException(`Message avec l'ID ${id} non trouvé`);
    }

    // Supprimer le message
    await this.prisma.messageChat.delete({
      where: { id },
    });

    // Invalider les caches
    await this.cacheManager.del(`message:${id}:${utilisateurId}`);
    await this.invalidateMessagerieCache();
  }

  // -------------------- GESTION DES RÉACTIONS --------------------
  async addReaction(
    messageId: string,
    createReactionDto: CreateReactionDto,
    utilisateurId: string,
  ): Promise<MessageResponse> {
    // Vérifier si le message existe
    const existingMessage = await this.prisma.messageChat.findUnique({
      where: { id: messageId },
      include: {
        discussion: {
          select: {
            createurId: true,
          },
        },
      },
    });

    if (!existingMessage) {
      throw new NotFoundException(`Message avec l'ID ${messageId} non trouvé`);
    }

    // Vérifier si l'utilisateur a accès à la discussion
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: existingMessage.discussionId },
      include: {
        messages: {
          where: {
            expediteurId: utilisateurId,
          },
          take: 1,
        },
      },
    });

    if (
      !discussion ||
      (discussion.createurId !== utilisateurId &&
        discussion.messages.length === 0)
    ) {
      throw new NotFoundException(`Message avec l'ID ${messageId} non trouvé`);
    }

    // Vérifier si l'utilisateur a déjà réagi à ce message
    const existingReaction = await this.prisma.reactionMessage.findUnique({
      where: {
        messageId_utilisateurId: {
          messageId,
          utilisateurId,
        },
      },
    });

    if (existingReaction) {
      // Mettre à jour la réaction existante
      await this.prisma.reactionMessage.update({
        where: { id: existingReaction.id },
        data: { type: createReactionDto.type },
      });
    } else {
      // Créer une nouvelle réaction
      await this.prisma.reactionMessage.create({
        data: {
          messageId,
          utilisateurId,
          type: createReactionDto.type,
        },
      });
    }

    // Invalider les caches
    await this.cacheManager.del(`message:${messageId}:${utilisateurId}`);
    await this.invalidateMessagerieCache();

    return this.findOneMessage(messageId, utilisateurId);
  }

  async removeReaction(
    messageId: string,
    utilisateurId: string,
  ): Promise<MessageResponse> {
    // Vérifier si la réaction existe
    const existingReaction = await this.prisma.reactionMessage.findUnique({
      where: {
        messageId_utilisateurId: {
          messageId,
          utilisateurId,
        },
      },
    });

    if (!existingReaction) {
      throw new NotFoundException(
        `Réaction non trouvée pour le message ${messageId}`,
      );
    }

    // Supprimer la réaction
    await this.prisma.reactionMessage.delete({
      where: { id: existingReaction.id },
    });

    // Invalider les caches
    await this.cacheManager.del(`message:${messageId}:${utilisateurId}`);
    await this.invalidateMessagerieCache();

    return this.findOneMessage(messageId, utilisateurId);
  }

  // -------------------- STATISTIQUES --------------------
  async getStats(utilisateurId?: string): Promise<MessagerieStatsResponse> {
    const cacheKey = `messagerie-stats:${utilisateurId || 'global'}`;
    const cachedStats = await this.cacheManager.get(cacheKey);

    if (cachedStats) {
      return cachedStats as MessagerieStatsResponse;
    }

    // Construire les filtres
    const discussionWhere: any = {};
    const messageWhere: any = {};

    if (utilisateurId) {
      discussionWhere.OR = [
        { createurId: utilisateurId },
        {
          messages: {
            some: {
              expediteurId: utilisateurId,
            },
          },
        },
      ];
      messageWhere.discussion = discussionWhere;
    }

    // Récupérer les statistiques
    const [
      totalDiscussions,
      totalMessages,
      discussionsActives,
      discussionsRecentes,
      messagesRecents,
    ] = await Promise.all([
      // Total des discussions
      this.prisma.discussion.count({ where: discussionWhere }),
      // Total des messages
      this.prisma.messageChat.count({ where: messageWhere }),
      // Discussions actives (avec un message dans les 7 derniers jours)
      this.prisma.discussion.count({
        where: {
          ...discussionWhere,
          messages: {
            some: {
              creeLe: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      }),
      // Discussions récentes
      this.prisma.discussion.findMany({
        where: discussionWhere,
        orderBy: { modifieLe: 'desc' },
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
          messages: {
            orderBy: { creeLe: 'desc' },
            take: 1,
            include: {
              expediteur: {
                select: {
                  id: true,
                  prenom: true,
                  nom: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      }),
      // Messages récents
      this.prisma.messageChat.findMany({
        where: messageWhere,
        orderBy: { creeLe: 'desc' },
        take: 5,
        include: {
          expediteur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              role: true,
            },
          },
          discussion: {
            select: {
              id: true,
              titre: true,
            },
          },
        },
      }),
    ]);

    // Top participants
    let topParticipants: Array<{
      id: string;
      prenom: string;
      nom: string;
      nombreMessages: number;
    }> = [];
    if (!utilisateurId) {
      const groupByResult = await this.prisma.messageChat.groupBy({
        by: ['expediteurId'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      });

      // Obtenir les détails des utilisateurs
      const utilisateursIds = groupByResult.map((p) => p.expediteurId);
      const utilisateurs = await this.prisma.utilisateur.findMany({
        where: { id: { in: utilisateursIds } },
        select: {
          id: true,
          prenom: true,
          nom: true,
        },
      });

      topParticipants = groupByResult.map((p) => {
        const utilisateur = utilisateurs.find((u) => u.id === p.expediteurId);
        return {
          id: p.expediteurId,
          prenom: utilisateur?.prenom || '',
          nom: utilisateur?.nom || '',
          nombreMessages: p._count.id,
        };
      });
    }

    const stats: MessagerieStatsResponse = {
      totalDiscussions,
      totalMessages,
      messagesNonLus: 0, // Non implémenté avec le schéma actuel
      discussionsActives,
      topParticipants,
      discussionsRecentes: utilisateurId
        ? await Promise.all(
            discussionsRecentes.map((discussion) =>
              this.formatDiscussionResponse(discussion, utilisateurId),
            ),
          )
        : [],
      messagesRecents: utilisateurId
        ? await Promise.all(
            messagesRecents.map((message) =>
              this.formatMessageResponse(message, utilisateurId),
            ),
          )
        : [],
    };

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300);

    return stats;
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private async formatDiscussionResponse(
    discussion: any,
    utilisateurId: string,
  ): Promise<DiscussionResponse> {
    // Formater le dernier message
    let dernierMessage;
    if (discussion.messages && discussion.messages.length > 0) {
      dernierMessage = {
        id: discussion.messages[0].id,
        contenu: discussion.messages[0].contenu,
        creeLe: discussion.messages[0].creeLe,
        expediteur: {
          id: discussion.messages[0].expediteur.id,
          prenom: discussion.messages[0].expediteur.prenom,
          nom: discussion.messages[0].expediteur.nom,
        },
      };
    }

    // Simuler des participants (créateur et autres expéditeurs de messages)
    const participantsSet = new Set();
    participantsSet.add(discussion.createur.id);

    // Récupérer tous les expéditeurs de messages pour cette discussion
    const messageExpediteurs = await this.prisma.messageChat.findMany({
      where: { discussionId: discussion.id },
      select: { expediteurId: true },
      distinct: ['expediteurId'],
    });

    messageExpediteurs.forEach((msg) => participantsSet.add(msg.expediteurId));

    // Obtenir les détails des participants
    const participantsDetails = await this.prisma.utilisateur.findMany({
      where: { id: { in: Array.from(participantsSet) as string[] } },
      select: {
        id: true,
        prenom: true,
        nom: true,
        role: true,
      },
    });

    const participants = participantsDetails.map((participant) => ({
      id: participant.id,
      prenom: participant.prenom,
      nom: participant.nom,
      role: participant.role as string, // Conversion explicite en string
      aRejointLe: discussion.creeLe, // Simulation
      dernierMessageLu:
        participant.id === utilisateurId ? new Date() : undefined, // Utiliser undefined au lieu de null
    }));

    return {
      id: discussion.id,
      titre: discussion.titre,
      statut: discussion.statut,
      creeLe: discussion.creeLe,
      modifieLe: discussion.modifieLe,
      dernierMessage,
      nombreMessages: discussion._count.messages,
      nombreMessagesNonLus: 0, // Non implémenté avec le schéma actuel
      createur: discussion.createur,
      dossier: discussion.dossier,
      participants,
    };
  }

  private async formatMessageResponse(
    message: any,
    utilisateurId: string,
  ): Promise<MessageResponse> {
    // Vérifier si le message a été modifié
    const estEdite = message.modifieLe > message.creeLe;

    // Obtenir les réactions du message
    const reactions = await this.prisma.reactionMessage.findMany({
      where: { messageId: message.id },
      include: {
        utilisateur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
          },
        },
      },
    });

    const formattedReactions = reactions.map((reaction) => ({
      id: reaction.id,
      type: reaction.type,
      creeLe: reaction.creeLe,
      utilisateur: {
        id: reaction.utilisateur.id,
        prenom: reaction.utilisateur.prenom,
        nom: reaction.utilisateur.nom,
      },
    }));

    return {
      id: message.id,
      contenu: message.contenu,
      statut: message.statut,
      creeLe: message.creeLe,
      modifieLe: message.modifieLe,
      expediteur: message.expediteur,
      discussion: {
        id: message.discussion.id,
        titre: message.discussion.titre,
      },
      reactions: formattedReactions,
      estLu: true, // Non implémenté avec le schéma actuel
      estEdite,
    };
  }

  private async invalidateMessagerieCache(): Promise<void> {
    try {
      // Invalider tous les caches liés à la messagerie
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores) &&
        this.cacheManager.stores.length > 0
      ) {
        const store = this.cacheManager.stores[0];

        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('discussions:*');
          const messageKeys = await store.keys('messages:*');
          const statsKeys = await store.keys('messagerie-stats:*');

          const allKeys = [...keys, ...messageKeys, ...statsKeys];

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
        "❌ Erreur lors de l'invalidation du cache de la messagerie:",
        error,
      );
    }
  }
}
