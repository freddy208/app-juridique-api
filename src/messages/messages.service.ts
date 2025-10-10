// src/messages/messages.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FilterMessageDto } from './dto/filter-message.dto';
import { Prisma, StatutMessage } from '@prisma/client';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filterDto: FilterMessageDto) {
    const {
      dossierId,
      expediteurId,
      statut,
      recherche,
      page = 1,
      limit = 20,
    } = filterDto;

    const skip = (page - 1) * limit;

    // Construction dynamique du where Prisma
    const where: Prisma.MessageChatWhereInput = {
      dossierId: dossierId || undefined,
      expediteurId: expediteurId || undefined,
      contenu: recherche
        ? { contains: recherche, mode: 'insensitive' }
        : undefined,
      statut: statut
        ? { equals: statut, not: 'SUPPRIME' } // combine filtre + exclusion
        : { not: 'SUPPRIME' }, // si aucun statut spécifié, on exclut seulement les supprimés
    };

    try {
      const [messages, total] = await Promise.all([
        this.prisma.messageChat.findMany({
          where,
          include: {
            expediteur: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                email: true,
                role: true,
              },
            },
            dossier: {
              select: { id: true, numeroUnique: true, titre: true },
            },
          },
          orderBy: { creeLe: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.messageChat.count({ where }),
      ]);

      return {
        total,
        page,
        limit,
        data: messages,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new BadRequestException(
        'Erreur lors de la récupération des messages',
      );
    }
  }
  // ✅ NOUVEL ENDPOINT : GET /chat/:id
  async findOne(id: string) {
    try {
      const message = await this.prisma.messageChat.findUnique({
        where: { id },
        include: {
          expediteur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
              role: true,
            },
          },
          dossier: {
            select: { id: true, numeroUnique: true, titre: true, statut: true },
          },
        },
      });

      if (!message) {
        throw new NotFoundException(`Message avec l'id ${id} introuvable`);
      }

      if (message.statut === 'SUPPRIME') {
        throw new BadRequestException('Ce message a été supprimé');
      }

      return message;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Erreur lors de la récupération du message',
      );
    }
  }
  // 🔹 Envoi d’un message
  async create(dto: CreateMessageDto) {
    const { contenu, dossierId, expediteurId } = dto;

    try {
      // Vérifier que l’expéditeur existe
      const expediteur = await this.prisma.utilisateur.findUnique({
        where: { id: expediteurId },
      });
      if (!expediteur) {
        throw new NotFoundException(`Expéditeur introuvable (${expediteurId})`);
      }

      // Vérifier que le dossier existe (si fourni)
      if (dossierId) {
        const dossier = await this.prisma.dossier.findUnique({
          where: { id: dossierId },
        });
        if (!dossier) {
          throw new NotFoundException(`Dossier introuvable (${dossierId})`);
        }
        if (dossier.statut === 'SUPPRIME') {
          throw new BadRequestException('Ce dossier est supprimé.');
        }
      }

      // Création du message
      const message = await this.prisma.messageChat.create({
        data: {
          contenu,
          dossierId: dossierId || null,
          expediteurId,
          statut: StatutMessage.ENVOYE,
        },
        include: {
          expediteur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
              role: true,
            },
          },
          dossier: {
            select: { id: true, numeroUnique: true, titre: true },
          },
        },
      });

      return {
        message: 'Message envoyé avec succès',
        data: message,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      console.error('Erreur création message :', error);
      throw new BadRequestException("Erreur lors de l'envoi du message");
    }
  }
  // src/messages/messages.service.ts
  async update(id: string, dto: UpdateMessageDto) {
    const { contenu, statut } = dto;

    try {
      // 🔹 Vérifier si le message existe
      const message = await this.prisma.messageChat.findUnique({
        where: { id },
      });

      if (!message) {
        throw new NotFoundException(`Message avec l'id ${id} introuvable`);
      }

      // 🔹 Vérifier qu’il n’est pas supprimé
      if (message.statut === 'SUPPRIME') {
        throw new BadRequestException(
          'Impossible de modifier un message supprimé',
        );
      }

      // 🔹 Mise à jour du message
      const updated = await this.prisma.messageChat.update({
        where: { id },
        data: {
          contenu: contenu ?? message.contenu,
          statut: statut ?? message.statut,
        },
        include: {
          expediteur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
              role: true,
            },
          },
          dossier: {
            select: { id: true, numeroUnique: true, titre: true },
          },
        },
      });

      return {
        message: 'Message modifié avec succès',
        data: updated,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Erreur modification message :', error);
      throw new BadRequestException(
        'Erreur lors de la modification du message',
      );
    }
  }
  // src/messages/messages.service.ts
  async remove(id: string) {
    try {
      // Vérifier que le message existe
      const message = await this.prisma.messageChat.findUnique({
        where: { id },
      });

      if (!message) {
        throw new NotFoundException(`Message avec l'id ${id} introuvable`);
      }

      // Vérifier s’il est déjà supprimé
      if (message.statut === 'SUPPRIME') {
        throw new BadRequestException('Ce message est déjà supprimé');
      }

      // Soft delete : on change le statut
      const deleted = await this.prisma.messageChat.update({
        where: { id },
        data: {
          statut: 'SUPPRIME',
          modifieLe: new Date(),
        },
        include: {
          expediteur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
              role: true,
            },
          },
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
            },
          },
        },
      });

      return {
        message: 'Message supprimé avec succès (soft delete)',
        data: deleted,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      console.error('Erreur suppression message :', error);
      throw new BadRequestException('Erreur lors de la suppression du message');
    }
  }
  // 🔹 GET /chat/:id/reactions
  async getReactions(messageId: string) {
    try {
      // Vérifier si le message existe
      const message = await this.prisma.messageChat.findUnique({
        where: { id: messageId },
        select: { id: true, statut: true },
      });

      if (!message) {
        throw new NotFoundException(
          `Message avec l'id ${messageId} introuvable`,
        );
      }

      if (message.statut === 'SUPPRIME') {
        throw new BadRequestException('Ce message a été supprimé');
      }

      // Récupérer les réactions
      const reactions = await this.prisma.reactionMessage.findMany({
        where: { messageId },
        include: {
          utilisateur: {
            select: { id: true, prenom: true, nom: true, email: true },
          },
        },
      });

      return {
        messageId,
        total: reactions.length,
        data: reactions,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Erreur lors de la récupération des réactions',
      );
    }
  }
  // src/messages/messages.service.ts
  async addReaction(messageId: string, dto: CreateReactionDto) {
    const { utilisateurId, type } = dto;

    try {
      // 🔹 Vérifier si le message existe
      const message = await this.prisma.messageChat.findUnique({
        where: { id: messageId },
        select: { id: true, statut: true },
      });

      if (!message) {
        throw new NotFoundException(
          `Message avec l'id ${messageId} introuvable`,
        );
      }

      if (message.statut === 'SUPPRIME') {
        throw new BadRequestException(
          'Impossible de réagir à un message supprimé',
        );
      }

      // 🔹 Vérifier que l’utilisateur existe
      const utilisateur = await this.prisma.utilisateur.findUnique({
        where: { id: utilisateurId },
        select: { id: true, statut: true },
      });

      if (!utilisateur) {
        throw new NotFoundException(`Utilisateur ${utilisateurId} introuvable`);
      }

      if (utilisateur.statut !== 'ACTIF') {
        throw new BadRequestException(
          'Utilisateur inactif, réaction impossible',
        );
      }

      // 🔹 Vérifier si l’utilisateur a déjà réagi à ce message
      const existingReaction = await this.prisma.reactionMessage.findUnique({
        where: {
          messageId_utilisateurId: {
            messageId,
            utilisateurId,
          },
        },
      });

      let reaction;

      if (existingReaction) {
        // ✅ Mise à jour du type de réaction
        reaction = await this.prisma.reactionMessage.update({
          where: {
            messageId_utilisateurId: {
              messageId,
              utilisateurId,
            },
          },
          data: { type },
          include: {
            utilisateur: {
              select: { id: true, prenom: true, nom: true, email: true },
            },
          },
        });
      } else {
        // ✅ Création d’une nouvelle réaction
        reaction = await this.prisma.reactionMessage.create({
          data: {
            messageId,
            utilisateurId,
            type,
          },
          include: {
            utilisateur: {
              select: { id: true, prenom: true, nom: true, email: true },
            },
          },
        });
      }

      return {
        message: existingReaction
          ? 'Réaction mise à jour avec succès'
          : 'Réaction ajoutée avec succès',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: reaction,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      console.error('Erreur lors de la création de réaction :', error);
      throw new BadRequestException(
        'Erreur lors de la création de la réaction',
      );
    }
  }
}
