import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FilterDocumentDto } from './dto/filter-document.dto';
import { Prisma, StatutDocument, Commentaire } from '@prisma/client';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findAll(filters: FilterDocumentDto) {
    const { dossierId, clientId, type, statut, skip = 0, take = 10 } = filters;

    const where: Prisma.DocumentWhereInput = {
      ...(dossierId && { dossierId }),
      ...(type && { type: { contains: type, mode: 'insensitive' } }),
      statut: statut ?? StatutDocument.ACTIF, // par défaut, seulement documents ACTIF
    };

    if (clientId) {
      where.dossier = { clientId };
    }

    // 🔥 Compter le total AVANT la pagination
    const totalCount = await this.prisma.document.count({ where });

    // 🔥 Récupérer la portion demandée
    const data = await this.prisma.document.findMany({
      where,
      skip,
      take,
      include: {
        dossier: {
          select: { id: true, numeroUnique: true, titre: true, type: true },
        },
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
      orderBy: { creeLe: 'desc' },
    });

    return { totalCount, skip, take, data };
  }
  /**
   * Récupère les détails d'un document par son ID
   * Vérifie toujours que le document est ACTIF (ou selon le statut passé)
   */
  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            type: true,
            client: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                nomEntreprise: true,
                email: true,
                telephone: true,
                statut: true,
              },
            },
            responsable: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                email: true,
              },
            },
          },
        },
        utilisateur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
          },
        },
      },
    });

    if (!document || document.statut === StatutDocument.SUPPRIME) {
      this.logger.warn(`Document non trouvé ou supprimé: ${id}`);
      throw new NotFoundException(`Document avec ID ${id} introuvable`);
    }

    return document;
  }
  async upload(
    file: Express.Multer.File,
    dto: UploadDocumentDto,
    utilisateurId: string,
  ) {
    // 1. Upload vers Cloudinary
    const result = await this.cloudinaryService.uploadFile(file);

    // 2. Sauvegarde en DB
    const document = await this.prisma.document.create({
      data: {
        dossierId: dto.dossierId,
        televersePar: utilisateurId,
        titre: dto.titre,
        type: dto.type,
        url: result.secure_url,
        statut: StatutDocument.ACTIF,
      },
      include: {
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            type: true,
          },
        },
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });

    this.logger.log(`Document uploadé: ${document.id} par ${utilisateurId}`);
    return document;
  }
  /**
   * Met à jour les métadonnées d'un document (titre, type, dossier)
   */
  async updateMetadata(
    id: string,
    dto: UpdateDocumentDto,
    utilisateurId: string,
  ) {
    // 1) Vérifier que le document existe
    const existing = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!existing) {
      this.logger.warn(
        `Tentative de modification d'un document introuvable: ${id}`,
      );
      throw new NotFoundException(`Document avec ID ${id} introuvable`);
    }

    // 2) Ne pas autoriser la modification d'un document supprimé
    if (existing.statut === StatutDocument.SUPPRIME) {
      this.logger.warn(
        `Tentative de modification d'un document supprimé: ${id}`,
      );
      throw new BadRequestException(
        `Impossible de modifier un document supprimé`,
      );
    }

    // 3) Si on demande à changer de dossier, vérifier que le dossier de destination existe et n'est pas supprimé
    if (dto.dossierId && dto.dossierId !== existing.dossierId) {
      const destDossier = await this.prisma.dossier.findUnique({
        where: { id: dto.dossierId },
      });
      if (!destDossier) {
        this.logger.warn(`Dossier destination introuvable: ${dto.dossierId}`);
        throw new NotFoundException(
          `Dossier avec ID ${dto.dossierId} introuvable`,
        );
      }
      if (destDossier.statut === 'SUPPRIME') {
        this.logger.warn(`Dossier destination supprimé: ${dto.dossierId}`);
        throw new BadRequestException(
          `Impossible d'assigner le document à un dossier supprimé`,
        );
      }
    }

    // 4) Construire l'objet de mise à jour (ne mettre que les champs fournis)
    const data: any = {};
    if (dto.titre !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      data.titre = dto.titre;
    }
    if (dto.type !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      data.type = dto.type;
    }
    if (dto.dossierId !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      data.dossierId = dto.dossierId;
    }

    // Optionnel : ajouter un journal/audit (ici on loggue)
    this.logger.log(
      `Utilisateur ${utilisateurId} met à jour document ${id} avec: ${JSON.stringify(data)}`,
    );

    // 5) Mise à jour dans la DB
    return await this.prisma.document.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data,
      include: {
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            type: true,
            client: {
              select: { id: true, prenom: true, nom: true, email: true },
            },
            responsable: {
              select: { id: true, prenom: true, nom: true, email: true },
            },
          },
        },
        utilisateur: {
          // ✅ car Document a bien une relation utilisateur
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });
  }
  async updateStatus(
    id: string,
    dto: UpdateDocumentStatusDto,
    utilisateurId: string,
  ) {
    const { statut } = dto;

    // 1) Vérifier existence
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      this.logger.warn(`Tentative de mise à jour d’un doc introuvable: ${id}`);
      throw new NotFoundException(`Document avec ID ${id} introuvable`);
    }

    // 2) Vérifier si déjà supprimé
    if (document.statut === StatutDocument.SUPPRIME) {
      this.logger.warn(`Tentative de modifier un doc supprimé: ${id}`);
      throw new BadRequestException(
        `Impossible de modifier un document supprimé`,
      );
    }

    // 3) Empêcher les transitions inutiles
    if (document.statut === statut) {
      this.logger.warn(`Statut identique demandé pour doc ${id}: ${statut}`);
      throw new BadRequestException(`Le document est déjà au statut ${statut}`);
    }

    // 4) Mise à jour
    const updated = await this.prisma.document.update({
      where: { id },
      data: { statut },
      include: {
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            type: true,
            client: {
              select: { id: true, prenom: true, nom: true, email: true },
            },
            responsable: {
              select: { id: true, prenom: true, nom: true, email: true },
            },
          },
        },
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });

    this.logger.log(
      `Utilisateur ${utilisateurId} a changé le statut du document ${id} de ${document.statut} → ${statut}`,
    );

    return updated;
  }
  /**
   * Supprimer (soft delete) un document
   * - Vérifie existence
   * - Vérifie si déjà supprimé
   * - Met à jour le statut → SUPPRIME
   * - (Optionnel) archive l'ancienne valeur dans JournalAudit
   */
  async softDelete(id: string, utilisateurId: string) {
    // 1. Vérifier existence
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      this.logger.warn(
        `Tentative suppression d’un document introuvable: ${id}`,
      );
      throw new NotFoundException(`Document avec ID ${id} introuvable`);
    }

    // 2. Vérifier si déjà supprimé
    if (document.statut === StatutDocument.SUPPRIME) {
      this.logger.warn(
        `Tentative suppression d’un document déjà supprimé: ${id}`,
      );
      throw new BadRequestException(`Le document est déjà supprimé`);
    }

    // 3. Soft delete → MAJ statut
    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        statut: StatutDocument.SUPPRIME,
        modifieLe: new Date(),
      },
      include: {
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            type: true,
            client: {
              select: { id: true, prenom: true, nom: true, email: true },
            },
          },
        },
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });

    // 4. Audit log
    await this.prisma.journalAudit.create({
      data: {
        utilisateurId,
        action: 'SUPPRESSION',
        typeCible: 'DOCUMENT',
        cibleId: id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ancienneValeur: document as any,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        nouvelleValeur: updated as any,
      },
    });

    this.logger.log(
      `Utilisateur ${utilisateurId} a supprimé le document ${id}`,
    );

    return {
      message: 'Document supprimé avec succès (soft delete)',
      document: updated,
    };
  }
  /**
   * Historique des versions d’un document
   * - Filtre par statut (ACTIF ou ARCHIVE)
   * - Tri par version décroissante (la plus récente en premier)
   */
  async getDocumentVersions(documentId: string) {
    // Vérifier que le document original existe
    const originalDoc = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { dossierId: true, titre: true },
    });

    if (!originalDoc) {
      this.logger.warn(
        `Historique versions: document introuvable ${documentId}`,
      );
      throw new NotFoundException(`Document avec ID ${documentId} introuvable`);
    }

    // Récupérer toutes les versions du document
    const versions = await this.prisma.document.findMany({
      where: {
        dossierId: originalDoc.dossierId,
        titre: originalDoc.titre, // on considère que toutes les versions partagent le même titre
        statut: { in: ['ACTIF', 'ARCHIVE'] },
      },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: {
          select: { id: true, numeroUnique: true, titre: true, type: true },
        },
      },
      orderBy: { version: 'desc' },
    });

    if (!versions || versions.length === 0) {
      this.logger.warn(`Aucune version trouvée pour document ${documentId}`);
      throw new NotFoundException(`Aucune version trouvée pour ce document`);
    }

    return {
      totalVersions: versions.length,
      documentId,
      versions,
    };
  }
  // src/documents/documents.service.ts
  async addNewVersion(
    documentId: string,
    file: Express.Multer.File,
    utilisateurId: string,
  ) {
    // 1️⃣ Vérifier que le document existe
    const originalDoc = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!originalDoc || originalDoc.statut === StatutDocument.SUPPRIME) {
      this.logger.warn(
        `Tentative d'ajout de version pour document introuvable ou supprimé: ${documentId}`,
      );
      throw new NotFoundException(
        `Document avec ID ${documentId} introuvable ou supprimé`,
      );
    }

    // 2️⃣ Récupérer la dernière version du document
    const lastVersion = await this.prisma.document.findFirst({
      where: {
        dossierId: originalDoc.dossierId,
        titre: originalDoc.titre,
        statut: { in: [StatutDocument.ACTIF, StatutDocument.ARCHIVE] },
      },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (lastVersion?.version || 1) + 1;

    // 3️⃣ Upload du fichier sur Cloudinary
    const result = await this.cloudinaryService.uploadFile(file);

    // 4️⃣ Création de la nouvelle version dans la DB
    const newDocumentVersion = await this.prisma.document.create({
      data: {
        dossierId: originalDoc.dossierId,
        televersePar: utilisateurId,
        titre: originalDoc.titre,
        type: originalDoc.type,
        url: result.secure_url,
        version: nextVersion,
        statut: StatutDocument.ACTIF,
      },
      include: {
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            type: true,
          },
        },
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });

    this.logger.log(
      `Nouvelle version (${nextVersion}) créée pour document ${documentId} par utilisateur ${utilisateurId}`,
    );

    return newDocumentVersion;
  }
  async getCommentsForDocument(documentId: string): Promise<{
    total: number;
    documentId: string;
    comments: (Commentaire & {
      utilisateur: { id: string; prenom: string; nom: string; email: string };
    })[];
  }> {
    // 1️⃣ Vérifier si le document existe et est valide
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, statut: true },
    });

    if (!document || document.statut === StatutDocument.SUPPRIME) {
      this.logger.warn(`Commentaires: document introuvable ${documentId}`);
      throw new NotFoundException(`Document avec ID ${documentId} introuvable`);
    }

    // 2️⃣ Récupérer les commentaires liés
    const comments = await this.prisma.commentaire.findMany({
      where: { documentId, statut: 'ACTIF' },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
      orderBy: { creeLe: 'desc' },
    });

    return {
      total: comments.length,
      documentId,
      comments,
    };
  }
  /**
   * Ajouter un commentaire à un document
   */
  async addCommentToDocument(
    documentId: string,
    dto: CreateCommentDto,
    utilisateurId: string,
  ): Promise<
    Commentaire & {
      utilisateur: { id: string; prenom: string; nom: string; email: string };
    }
  > {
    // 1️⃣ Vérifier si le document existe et est ACTIF
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, statut: true },
    });

    if (!document || document.statut === StatutDocument.SUPPRIME) {
      this.logger.warn(
        `Tentative d'ajout de commentaire sur document introuvable ou supprimé: ${documentId}`,
      );
      throw new NotFoundException(`Document avec ID ${documentId} introuvable`);
    }

    // 2️⃣ Créer le commentaire
    const commentaire = await this.prisma.commentaire.create({
      data: {
        documentId,
        utilisateurId,
        contenu: dto.contenu,
        statut: 'ACTIF',
      },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });

    this.logger.log(
      `Commentaire ajouté par utilisateur ${utilisateurId} sur document ${documentId}`,
    );
    return commentaire;
  }
  async updateComment(
    documentId: string,
    commentId: string,
    dto: UpdateCommentDto,
    utilisateurId: string,
  ): Promise<
    Commentaire & {
      utilisateur: { id: string; prenom: string; nom: string; email: string };
    }
  > {
    // 1️⃣ Vérifier le document
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, statut: true },
    });

    if (!document || document.statut === StatutDocument.SUPPRIME) {
      this.logger.warn(
        `Tentative de modification commentaire sur doc introuvable ou supprimé: ${documentId}`,
      );
      throw new NotFoundException(`Document avec ID ${documentId} introuvable`);
    }

    // 2️⃣ Vérifier le commentaire
    const commentaire = await this.prisma.commentaire.findUnique({
      where: { id: commentId },
      include: { utilisateur: true },
    });

    if (!commentaire || commentaire.statut === 'SUPPRIME') {
      this.logger.warn(`Commentaire introuvable ou supprimé: ${commentId}`);
      throw new NotFoundException(
        `Commentaire avec ID ${commentId} introuvable`,
      );
    }

    // 3️⃣ Ne pas autoriser la modification si le commentaire n'appartient pas à ce document
    if (commentaire.documentId !== documentId) {
      this.logger.warn(
        `Commentaire ${commentId} n'appartient pas au document ${documentId}`,
      );
      throw new BadRequestException(
        `Commentaire n'appartient pas à ce document`,
      );
    }

    // 4️⃣ Mise à jour
    const updated = await this.prisma.commentaire.update({
      where: { id: commentId },
      data: { contenu: dto.contenu },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });

    this.logger.log(
      `Utilisateur ${utilisateurId} a modifié commentaire ${commentId} du document ${documentId}`,
    );

    return updated;
  }
  async softDeleteComment(
    documentId: string,
    commentId: string,
    utilisateurId: string,
  ) {
    // 1️⃣ Vérifier que le document existe et est ACTIF
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, statut: true },
    });

    if (!document || document.statut === StatutDocument.SUPPRIME) {
      this.logger.warn(
        `Suppression commentaire: document introuvable ${documentId}`,
      );
      throw new NotFoundException(`Document avec ID ${documentId} introuvable`);
    }

    // 2️⃣ Vérifier que le commentaire existe et n'est pas déjà supprimé
    const commentaire = await this.prisma.commentaire.findUnique({
      where: { id: commentId },
      include: { utilisateur: true },
    });

    if (!commentaire || commentaire.statut === 'SUPPRIME') {
      this.logger.warn(
        `Commentaire introuvable ou déjà supprimé: ${commentId}`,
      );
      throw new NotFoundException(
        `Commentaire avec ID ${commentId} introuvable`,
      );
    }

    // 3️⃣ Vérifier que le commentaire appartient bien au document
    if (commentaire.documentId !== documentId) {
      this.logger.warn(
        `Commentaire ${commentId} n'appartient pas au document ${documentId}`,
      );
      throw new BadRequestException(
        `Commentaire n'appartient pas à ce document`,
      );
    }

    // 4️⃣ Soft delete → MAJ statut
    const updated = await this.prisma.commentaire.update({
      where: { id: commentId },
      data: { statut: 'SUPPRIME', modifieLe: new Date() },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });

    // 5️⃣ Journal audit
    await this.prisma.journalAudit.create({
      data: {
        utilisateurId,
        action: 'SUPPRESSION',
        typeCible: 'COMMENTAIRE',
        cibleId: commentId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ancienneValeur: commentaire as any,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        nouvelleValeur: updated as any,
      },
    });

    this.logger.log(
      `Utilisateur ${utilisateurId} a supprimé le commentaire ${commentId}`,
    );
    return {
      message: 'Commentaire supprimé avec succès (soft delete)',
      commentaire: updated,
    };
  }
}
