import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FilterTacheDto } from './dto/filter-tache.dto';
import { CreateTacheDto } from './dto/create-tache.dto';
import { UpdateTacheDto } from './dto/update-tache.dto';
import { UpdateStatusTacheDto } from './dto/update-status-tache.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class TachesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: FilterTacheDto) {
    const { dossierId, assigneeId, statut, search, skip, take } = filters;

    const where: any = {
      statut: { not: 'SUPPRIME' }, // Exclure les tâches supprimées
      ...(dossierId && { dossierId }),
      ...(assigneeId && { assigneeId }),
      ...(statut && { statut }),
      ...(search && {
        OR: [
          { titre: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Compte total avant pagination
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const totalCount = await this.prisma.tache.count({ where });

    // Récupération paginée
    const data = await this.prisma.tache.findMany({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where,
      skip,
      take,
      orderBy: { creeLe: 'desc' },
      include: {
        assignee: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: { select: { id: true, numeroUnique: true, titre: true } },
      },
    });

    return { totalCount, skip, take, data };
  }
  // 🔹 Nouveau : Détails d'une tâche
  async findOne(id: string) {
    const tache = await this.prisma.tache.findUnique({
      where: { id },
      include: {
        assignee: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: {
          select: { id: true, numeroUnique: true, titre: true, type: true },
        },
        Commentaire: {
          where: { statut: 'ACTIF' },
          orderBy: { creeLe: 'desc' },
          include: {
            utilisateur: {
              select: { id: true, prenom: true, nom: true, email: true },
            },
          },
        },
      },
    });

    // Vérifier si la tâche existe et n’est pas supprimée
    if (!tache || tache.statut === 'SUPPRIME') {
      throw new NotFoundException(
        `Tâche avec l'identifiant ${id} introuvable.`,
      );
    }

    return tache;
  }
  // 🟢 Créer une tâche
  async create(dto: CreateTacheDto, userId: string) {
    const { dossierId, assigneeId, titre, description, dateLimite, statut } =
      dto;

    // 🔸 Vérifier dossier s’il est fourni
    if (dossierId) {
      const dossier = await this.prisma.dossier.findUnique({
        where: { id: dossierId },
      });
      if (!dossier)
        throw new NotFoundException(
          `Dossier avec ID ${dossierId} introuvable.`,
        );
    }

    // 🔸 Vérifier l’assignee s’il est fourni
    if (assigneeId) {
      const assignee = await this.prisma.utilisateur.findUnique({
        where: { id: assigneeId },
      });
      if (!assignee)
        throw new NotFoundException(
          `Utilisateur assigné avec ID ${assigneeId} introuvable.`,
        );
    }

    // 🔹 Création de la tâche
    const tache = await this.prisma.tache.create({
      data: {
        titre,
        description,
        dossierId,
        assigneeId,
        creeParId: userId,
        dateLimite: dateLimite ? new Date(dateLimite) : null,
        statut: statut || 'A_FAIRE',
      },
      include: {
        assignee: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: { select: { id: true, numeroUnique: true, titre: true } },
      },
    });

    return {
      message: 'Tâche créée avec succès',
      tache,
    };
  }
  async update(id: string, dto: UpdateTacheDto, userId: string) {
    const { dossierId, assigneeId, titre, description, dateLimite, statut } =
      dto;

    // Vérifier que la tâche existe
    const tacheExistante = await this.prisma.tache.findUnique({
      where: { id },
    });
    if (!tacheExistante || tacheExistante.statut === 'SUPPRIME') {
      throw new NotFoundException(
        `Tâche avec l'identifiant ${id} introuvable.`,
      );
    }

    // 🔒 Contrôle d'accès : seul le créateur ou un admin peut modifier
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
    });
    if (!utilisateur) throw new NotFoundException(`Utilisateur introuvable.`);

    if (tacheExistante.creeParId !== userId && utilisateur.role !== 'ADMIN') {
      throw new ForbiddenException(
        "Vous n'avez pas la permission de modifier cette tâche.",
      );
    }

    // Vérifier le dossier si fourni
    if (dossierId) {
      const dossier = await this.prisma.dossier.findUnique({
        where: { id: dossierId },
      });
      if (!dossier)
        throw new NotFoundException(
          `Dossier avec ID ${dossierId} introuvable.`,
        );
    }

    // Vérifier l’assignee si fourni
    if (assigneeId) {
      const assignee = await this.prisma.utilisateur.findUnique({
        where: { id: assigneeId },
      });
      if (!assignee)
        throw new NotFoundException(
          `Utilisateur assigné avec ID ${assigneeId} introuvable.`,
        );
    }

    // Mettre à jour la tâche
    const updatedTache = await this.prisma.tache.update({
      where: { id },
      data: {
        ...(titre && { titre }),
        ...(description && { description }),
        ...(dossierId && { dossierId }),
        ...(assigneeId && { assigneeId }),
        ...(dateLimite && { dateLimite: new Date(dateLimite) }),
        ...(statut && { statut }),
        modifieLe: new Date(),
      },
      include: {
        assignee: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: { select: { id: true, numeroUnique: true, titre: true } },
      },
    });

    return {
      message: 'Tâche mise à jour avec succès',
      tache: updatedTache,
    };
  }
  // 🔹 Nouveau : Mettre à jour uniquement le statut
  async updateStatus(id: string, dto: UpdateStatusTacheDto, userId: string) {
    const { statut } = dto;

    // Vérifier que la tâche existe
    const tacheExistante = await this.prisma.tache.findUnique({
      where: { id },
    });
    if (!tacheExistante || tacheExistante.statut === 'SUPPRIME') {
      throw new NotFoundException(
        `Tâche avec l'identifiant ${id} introuvable.`,
      );
    }

    // 🔒 Contrôle d'accès : seul le créateur ou un admin
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
    });
    if (!utilisateur) throw new NotFoundException(`Utilisateur introuvable.`);
    if (tacheExistante.creeParId !== userId && utilisateur.role !== 'ADMIN') {
      throw new ForbiddenException(
        "Vous n'avez pas la permission de modifier le statut de cette tâche.",
      );
    }

    // Mettre à jour le statut
    const updatedTache = await this.prisma.tache.update({
      where: { id },
      data: { statut, modifieLe: new Date() },
      include: {
        assignee: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: { select: { id: true, numeroUnique: true, titre: true } },
      },
    });

    return {
      message: `Statut de la tâche mis à jour avec succès`,
      tache: updatedTache,
    };
  }
  async softDelete(id: string, userId: string) {
    // Vérifier que la tâche existe
    const tacheExistante = await this.prisma.tache.findUnique({
      where: { id },
    });

    if (!tacheExistante || tacheExistante.statut === 'SUPPRIME') {
      throw new NotFoundException(
        `Tâche avec l'identifiant ${id} introuvable.`,
      );
    }

    // 🔒 Contrôle d'accès : seul le créateur ou un admin peut supprimer
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
    });
    if (!utilisateur) throw new NotFoundException(`Utilisateur introuvable.`);

    if (tacheExistante.creeParId !== userId && utilisateur.role !== 'ADMIN') {
      throw new ForbiddenException(
        "Vous n'avez pas la permission de supprimer cette tâche.",
      );
    }

    // Soft delete : mettre à jour le statut à SUPPRIME
    const deletedTache = await this.prisma.tache.update({
      where: { id },
      data: {
        statut: 'SUPPRIME',
        modifieLe: new Date(),
      },
      include: {
        assignee: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: { select: { id: true, numeroUnique: true, titre: true } },
      },
    });

    return {
      message: 'Tâche supprimée avec succès',
      tache: deletedTache,
    };
  }
  // 🔹 Récupérer les commentaires d'une tâche
  async findCommentsByTacheId(tacheId: string) {
    // Vérifier que la tâche existe et n'est pas supprimée
    const tache = await this.prisma.tache.findUnique({
      where: { id: tacheId },
    });

    if (!tache || tache.statut === 'SUPPRIME') {
      throw new NotFoundException(
        `Tâche avec l'identifiant ${tacheId} introuvable.`,
      );
    }

    // Récupérer les commentaires actifs
    const commentaires = await this.prisma.commentaire.findMany({
      where: {
        tacheId,
        statut: 'ACTIF',
      },
      orderBy: { creeLe: 'desc' },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });

    return {
      tacheId,
      total: commentaires.length,
      commentaires,
    };
  }
  async addComment(tacheId: string, dto: CreateCommentDto, userId: string) {
    // Vérifier que la tâche existe et n’est pas supprimée
    const tache = await this.prisma.tache.findUnique({
      where: { id: tacheId },
    });

    if (!tache || tache.statut === 'SUPPRIME') {
      throw new NotFoundException(
        `Tâche avec l'identifiant ${tacheId} introuvable.`,
      );
    }

    // Création du commentaire
    const commentaire = await this.prisma.commentaire.create({
      data: {
        tacheId,
        utilisateurId: userId,
        contenu: dto.contenu,
        statut: 'ACTIF',
      },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });

    return {
      message: 'Commentaire ajouté avec succès',
      commentaire,
    };
  }
  async updateComment(
    tacheId: string,
    commentId: string,
    contenu: string,
    userId: string,
  ) {
    // Vérifier que la tâche existe et n'est pas supprimée
    const tache = await this.prisma.tache.findUnique({
      where: { id: tacheId },
    });
    if (!tache || tache.statut === 'SUPPRIME') {
      throw new NotFoundException(
        `Tâche avec l'identifiant ${tacheId} introuvable.`,
      );
    }

    // Vérifier que le commentaire existe et est actif
    const commentaire = await this.prisma.commentaire.findUnique({
      where: { id: commentId },
      include: { utilisateur: true },
    });

    if (!commentaire || commentaire.statut === 'SUPPRIME') {
      throw new NotFoundException(
        `Commentaire avec l'identifiant ${commentId} introuvable.`,
      );
    }

    // Vérifier que le commentaire appartient à la tâche
    if (commentaire.tacheId !== tacheId) {
      throw new ForbiddenException(
        "Le commentaire n'appartient pas à cette tâche.",
      );
    }

    // 🔒 Contrôle d'accès : seul le créateur du commentaire ou admin
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
    });
    if (!utilisateur) throw new NotFoundException(`Utilisateur introuvable.`);

    if (commentaire.utilisateurId !== userId && utilisateur.role !== 'ADMIN') {
      throw new ForbiddenException(
        "Vous n'avez pas la permission de modifier ce commentaire.",
      );
    }

    // Mettre à jour le contenu
    const updatedComment = await this.prisma.commentaire.update({
      where: { id: commentId },
      data: {
        contenu,
        modifieLe: new Date(),
      },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });

    return {
      message: 'Commentaire mis à jour avec succès',
      commentaire: updatedComment,
    };
  }
  async softDeleteComment(tacheId: string, commentId: string, userId: string) {
    // Vérifier que la tâche existe et n'est pas supprimée
    const tache = await this.prisma.tache.findUnique({
      where: { id: tacheId },
    });
    if (!tache || tache.statut === 'SUPPRIME') {
      throw new NotFoundException(
        `Tâche avec l'identifiant ${tacheId} introuvable.`,
      );
    }

    // Vérifier que le commentaire existe et est actif
    const commentaire = await this.prisma.commentaire.findUnique({
      where: { id: commentId },
      include: { utilisateur: true },
    });

    if (!commentaire || commentaire.statut === 'SUPPRIME') {
      throw new NotFoundException(
        `Commentaire avec l'identifiant ${commentId} introuvable.`,
      );
    }

    // Vérifier que le commentaire appartient à la tâche
    if (commentaire.tacheId !== tacheId) {
      throw new ForbiddenException(
        "Le commentaire n'appartient pas à cette tâche.",
      );
    }

    // 🔒 Contrôle d'accès : seul le créateur du commentaire ou admin
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
    });
    if (!utilisateur) throw new NotFoundException(`Utilisateur introuvable.`);

    if (commentaire.utilisateurId !== userId && utilisateur.role !== 'ADMIN') {
      throw new ForbiddenException(
        "Vous n'avez pas la permission de supprimer ce commentaire.",
      );
    }

    // Soft delete : mettre à jour le statut à SUPPRIME
    const deletedComment = await this.prisma.commentaire.update({
      where: { id: commentId },
      data: {
        statut: 'SUPPRIME',
        modifieLe: new Date(),
      },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });

    return {
      message: 'Commentaire supprimé avec succès',
      commentaire: deletedComment,
    };
  }
}
