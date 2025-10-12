// src/dossiers/dossiers.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FilterDossierDto } from './dto/filter-dossier.dto';
import { Prisma, StatutDossier, StatutEvenement } from '@prisma/client';
import { CreateDossierDto } from './dto/create-dossier.dto';
import { UpdateDossierDto } from './dto/update-dossier.dto';
import { CreateDossierNoteDto } from './dto/create-dossier-note.dto';
import { UpdateDossierNoteDto } from './dto/update-dossier-note.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class DossiersService {
  private readonly logger = new Logger(DossiersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FilterDossierDto) {
    const { statut, type, clientId, responsableId, skip, take } = filters;

    const where: Prisma.DossierWhereInput = {};

    if (statut) {
      where.statut = statut;
    }
    if (type) {
      where.type = type;
    }
    if (clientId) {
      where.clientId = clientId;
    }
    if (responsableId) {
      where.responsableId = responsableId;
    }

    const totalCount = await this.prisma.dossier.count({ where });

    const data = await this.prisma.dossier.findMany({
      where,
      skip,
      take,
      include: {
        client: true,
        responsable: true,
        contentieux: true,
        contrat: true,
        documents: true,
        evenements: true,
        factures: true,
        immobilier: true,
        messages: true,
        sinistreCorporel: true,
        sinistreMateriel: true,
        sinistreMortel: true,
        sport: true,
        taches: true,
        notes: true,
      },
      orderBy: { creeLe: 'desc' },
    });

    return {
      totalCount,
      skip,
      take,
      data,
    };
  }
  // ✅ Nouveau : récupérer un dossier par ID avec toutes les relations
  async findOne(id: string) {
    const dossier = await this.prisma.dossier.findUnique({
      where: { id, statut: { not: 'SUPPRIME' } }, // Exclure les dossiers supprimés
      include: {
        client: true,
        responsable: true,
        contentieux: true,
        contrat: true,
        documents: true,
        evenements: true,
        factures: true,
        immobilier: true,
        messages: true,
        sinistreCorporel: true,
        sinistreMateriel: true,
        sinistreMortel: true,
        sport: true,
        taches: true,
        notes: true,
      },
    });

    if (!dossier) {
      this.logger.warn(`Dossier with ID ${id} not found`);
      throw new NotFoundException(`Dossier with ID ${id} not found`);
    }

    return dossier;
  }
  /**
   * Créer un dossier avec un numéro unique sous la forme PREFIX+ANNEE+INCR
   * Exemple : SC20250001
   */
  async create(createDossierDto: CreateDossierDto) {
    const { titre, type, description, clientId, responsableId, statut } =
      createDossierDto;

    // Vérifier que le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: clientId, statut: 'ACTIF' },
    });
    if (!client) {
      this.logger.warn(`Client with ID ${clientId} not found`);
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    // Vérifier que le responsable existe si fourni
    if (responsableId) {
      const responsable = await this.prisma.utilisateur.findUnique({
        where: { id: responsableId, statut: 'ACTIF' },
      });
      if (!responsable) {
        this.logger.warn(`Responsable with ID ${responsableId} not found`);
        throw new NotFoundException(
          `Responsable with ID ${responsableId} not found`,
        );
      }
    }

    // Préfixes par type de dossier
    const prefixMap: Record<string, string> = {
      SINISTRE_CORPOREL: 'SC',
      SINISTRE_MATERIEL: 'SM',
      SINISTRE_MORTEL: 'SMO',
      IMMOBILIER: 'IM',
      SPORT: 'SP',
      CONTRAT: 'CT',
      CONTENTIEUX: 'CO',
      AUTRE: 'AU',
    };

    const prefix = prefixMap[type];
    const year = new Date().getFullYear();

    // ✅ Transaction Prisma pour éviter doublons
    const dossier = await this.prisma.$transaction(async (tx) => {
      // Chercher le dernier numéro pour ce type + année
      const lastDossier = await tx.dossier.findFirst({
        where: {
          type,
          numeroUnique: { startsWith: `${prefix}${year}` },
        },
        orderBy: { numeroUnique: 'desc' }, // On trie sur le numéro unique
      });

      let increment = 1;
      if (lastDossier) {
        const lastNumber = parseInt(lastDossier.numeroUnique.slice(-4), 10);
        increment = lastNumber + 1;
      }

      const numeroUnique = `${prefix}${year}${increment.toString().padStart(4, '0')}`;

      // Créer le dossier dans la même transaction
      return await tx.dossier.create({
        data: {
          titre,
          type,
          description,
          clientId,
          responsableId: responsableId || null,
          statut: statut || 'OUVERT',
          numeroUnique,
        },
        include: {
          client: true,
          responsable: true,
          contentieux: true,
          contrat: true,
          documents: true,
          evenements: true,
          factures: true,
          immobilier: true,
          messages: true,
          sinistreCorporel: true,
          sinistreMateriel: true,
          sinistreMortel: true,
          sport: true,
          taches: true,
          notes: true,
        },
      });
    });

    this.logger.log(
      `✅ Dossier créé avec numeroUnique ${dossier.numeroUnique}`,
    );
    return dossier;
  }
  /**
   * Mettre à jour un dossier existant
   */
  async update(id: string, updateDossierDto: UpdateDossierDto) {
    const { clientId, responsableId, ...updateData } = updateDossierDto;

    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id, statut: { not: 'SUPPRIME' } },
    });
    if (!dossier) {
      this.logger.warn(
        `❌ Tentative de mise à jour d’un dossier inexistant: ${id}`,
      );
      throw new NotFoundException(`Dossier avec ID ${id} introuvable`);
    }

    // Vérifier que le client existe si on le change
    if (clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId, statut: 'ACTIF' },
      });
      if (!client) {
        throw new NotFoundException(`Client avec ID ${clientId} introuvable`);
      }
    }

    // Vérifier que le responsable existe si on le change
    if (responsableId) {
      const responsable = await this.prisma.utilisateur.findUnique({
        where: { id: responsableId },
      });
      if (!responsable) {
        throw new NotFoundException(
          `Responsable avec ID ${responsableId} introuvable`,
        );
      }
    }

    // Mise à jour du dossier
    const updated = await this.prisma.dossier.update({
      where: { id, statut: { not: 'SUPPRIME' } },
      data: {
        ...updateData,
        clientId: clientId ?? dossier.clientId,
        responsableId: responsableId ?? dossier.responsableId,
      },
      include: {
        client: true,
        responsable: true,
        contentieux: true,
        contrat: true,
        documents: true,
        evenements: true,
        factures: true,
        immobilier: true,
        messages: true,
        sinistreCorporel: true,
        sinistreMateriel: true,
        sinistreMortel: true,
        sport: true,
        taches: true,
        notes: true,
      },
    });

    this.logger.log(`✅ Dossier ${id} mis à jour avec succès`);
    return updated;
  }
  /**
   * Mettre à jour uniquement le statut d’un dossier
   */
  async updateStatus(id: string, newStatus: StatutDossier) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id, statut: { not: 'SUPPRIME' } },
    });

    if (!dossier) {
      this.logger.warn(
        `❌ Tentative de changement de statut sur dossier inexistant: ${id}`,
      );
      throw new NotFoundException(`Dossier avec ID ${id} introuvable`);
    }

    // Mise à jour uniquement du statut
    const updated = await this.prisma.dossier.update({
      where: { id },
      data: { statut: newStatus },
      include: {
        client: true,
        responsable: true,
      },
    });

    this.logger.log(
      `✅ Statut du dossier ${id} mis à jour: ${dossier.statut} ➝ ${newStatus}`,
    );

    return {
      message: `Statut du dossier mis à jour avec succès`,
      dossier: updated,
    };
  }
  /**
   * Soft delete d’un dossier (statut = SUPPRIME)
   */
  async softDelete(id: string, utilisateurId?: string) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id, statut: { not: 'SUPPRIME' } },
    });
    if (!dossier) {
      this.logger.warn(
        `❌ Tentative de suppression d’un dossier inexistant: ${id}`,
      );
      throw new NotFoundException(`Dossier avec ID ${id} introuvable`);
    }

    // Vérifier si déjà supprimé
    if (dossier.statut === 'SUPPRIME') {
      this.logger.warn(`⚠️ Dossier ${id} déjà marqué comme supprimé`);
      return {
        message: `Dossier déjà supprimé`,
        dossier,
      };
    }

    // Mettre à jour le statut
    const deleted = await this.prisma.dossier.update({
      where: { id },
      data: {
        statut: 'SUPPRIME',
      },
      include: {
        client: true,
        responsable: true,
      },
    });

    // Journal d’audit (optionnel mais recommandé)
    await this.prisma.journalAudit.create({
      data: {
        utilisateurId: utilisateurId || 'system',
        action: 'SUPPRESSION',
        typeCible: 'DOSSIER',
        cibleId: id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ancienneValeur: dossier as any,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        nouvelleValeur: { statut: 'SUPPRIME' } as any,
      },
    });

    this.logger.log(`🗑️ Dossier ${id} marqué comme SUPPRIME`);
    return {
      message: `Dossier supprimé (soft delete)`,
      dossier: deleted,
    };
  }
  // src/dossiers/dossiers.service.ts
  async findDocuments(dossierId: string) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
    });

    if (!dossier) {
      this.logger.warn(`Dossier with ID ${dossierId} not found`);
      throw new NotFoundException(`Dossier with ID ${dossierId} not found`);
    }

    // Récupérer uniquement les documents actifs
    const documents = await this.prisma.document.findMany({
      where: {
        dossierId,
        statut: 'ACTIF', // On ne renvoie que les documents ACTIF par défaut
      },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
      orderBy: { creeLe: 'desc' },
    });

    return { dossierId, total: documents.length, documents };
  }
  // src/dossiers/dossiers.service.ts
  async findTasks(dossierId: string) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
    });

    if (!dossier) {
      this.logger.warn(`Dossier with ID ${dossierId} not found`);
      throw new NotFoundException(`Dossier with ID ${dossierId} not found`);
    }

    // Récupérer uniquement les tâches non supprimées
    const taches = await this.prisma.tache.findMany({
      where: {
        dossierId,
        statut: { not: 'SUPPRIME' }, // exclure les tâches supprimées
      },
      include: {
        assignee: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: {
          select: { id: true, titre: true, numeroUnique: true },
        },
      },
      orderBy: { creeLe: 'desc' },
    });

    return {
      dossierId,
      total: taches.length,
      taches,
    };
  }
  // src/dossiers/dossiers.service.ts
  async findCalendarEvents(dossierId: string) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
    });

    if (!dossier) {
      this.logger.warn(`Dossier with ID ${dossierId} not found`);
      throw new NotFoundException(`Dossier with ID ${dossierId} not found`);
    }

    // Récupérer les événements liés au dossier, uniquement ceux non supprimés
    const evenements = await this.prisma.evenementCalendrier.findMany({
      where: {
        dossierId,
        statut: { not: 'SUPPRIME' }, // Exclure les événements supprimés
      },
      include: {
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: {
          select: { id: true, titre: true, numeroUnique: true },
        },
      },
      orderBy: { debut: 'asc' }, // Trier par date de début
    });

    return {
      dossierId,
      total: evenements.length,
      evenements,
    };
  }
  // src/dossiers/dossiers.service.ts
  // src/dossiers/dossiers.service.ts
  async findChatMessagesPaginated(
    dossierId: string,
    skip = 0,
    take = 20, // nombre de messages par batch
  ) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId, statut: { not: 'SUPPRIME' } },
    });

    if (!dossier) {
      this.logger.warn(`Dossier with ID ${dossierId} not found`);
      throw new NotFoundException(`Dossier with ID ${dossierId} not found`);
    }

    const totalCount = await this.prisma.messageChat.count({
      where: {
        dossierId,
        statut: { not: 'SUPPRIME' },
      },
    });

    const messages = await this.prisma.messageChat.findMany({
      where: {
        dossierId,
        statut: { not: 'SUPPRIME' },
      },
      include: {
        expediteur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: {
          select: { id: true, titre: true, numeroUnique: true },
        },
      },
      orderBy: { creeLe: 'asc' },
      skip,
      take,
    });

    return {
      dossierId,
      totalCount,
      skip,
      take,
      messages,
    };
  }
  // src/dossiers/dossiers.service.ts
  async findNotesPaginated(
    dossierId: string,
    skip = 0,
    take = 20, // par défaut 20 notes
  ) {
    // Vérifier que le dossier existe et n'est pas supprimé
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId, statut: { not: 'SUPPRIME' } },
    });

    if (!dossier) {
      this.logger.warn(`Dossier with ID ${dossierId} not found`);
      throw new NotFoundException(`Dossier with ID ${dossierId} not found`);
    }

    // Nombre total de notes actives
    const totalCount = await this.prisma.note.count({
      where: {
        dossierId,
        statut: 'ACTIF', // seulement les notes actives
      },
    });

    // Récupération des notes actives
    const notes = await this.prisma.note.findMany({
      where: {
        dossierId,
        statut: 'ACTIF',
      },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
      orderBy: { creeLe: 'desc' }, // la plus récente en premier
      skip,
      take,
    });

    return {
      dossierId,
      totalCount,
      skip,
      take,
      notes,
    };
  }
  // ✅ Ajouter une note interne
  async addNote(
    dossierId: string,
    createNoteDto: CreateDossierNoteDto,
    utilisateurId: string,
  ) {
    // Vérifier que le dossier existe et n'est pas supprimé
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId, statut: { not: 'SUPPRIME' } },
    });
    if (!dossier) {
      throw new NotFoundException(`Dossier ${dossierId} introuvable`);
    }

    return await this.prisma.note.create({
      data: {
        contenu: createNoteDto.contenu,
        dossierId,
        clientId: dossier.clientId,
        utilisateurId,
      },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });
  }

  // ✅ Modifier une note interne
  async updateNote(
    dossierId: string,
    noteId: string,
    updateNoteDto: UpdateDossierNoteDto,
  ) {
    // Vérifier que la note existe et est active
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });
    if (!note || note.statut === 'SUPPRIME') {
      throw new NotFoundException(`Note ${noteId} introuvable ou supprimée`);
    }

    // Vérifier que le dossier correspond
    if (note.dossierId !== dossierId) {
      throw new NotFoundException(
        `La note ${noteId} n'appartient pas au dossier ${dossierId}`,
      );
    }

    return await this.prisma.note.update({
      where: { id: noteId },
      data: {
        contenu: updateNoteDto.contenu,
      },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });
  }

  // ✅ Supprimer une note (soft delete)
  async softDeleteNote(dossierId: string, noteId: string) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note || note.statut === 'SUPPRIME') {
      throw new NotFoundException(
        `Note ${noteId} introuvable ou déjà supprimée`,
      );
    }

    if (note.dossierId !== dossierId) {
      throw new NotFoundException(
        `La note ${noteId} n'appartient pas au dossier ${dossierId}`,
      );
    }

    const deleted = await this.prisma.note.update({
      where: { id: noteId },
      data: { statut: 'SUPPRIME' },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });

    return { message: 'Note supprimée (soft delete)', note: deleted };
  }
  // src/dossiers/dossiers.service.ts
  async findEvents(dossierId: string) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
    });

    if (!dossier) {
      this.logger.warn(`Dossier with ID ${dossierId} not found`);
      throw new NotFoundException(`Dossier with ID ${dossierId} not found`);
    }

    // Récupérer les événements assignés au dossier
    const evenements = await this.prisma.evenementCalendrier.findMany({
      where: {
        dossierId,
        statut: { not: 'SUPPRIME' }, // exclure les événements supprimés
      },
      include: {
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: {
          select: { id: true, titre: true, numeroUnique: true },
        },
      },
      orderBy: { debut: 'asc' }, // tri chronologique
    });

    return {
      dossierId,
      total: evenements.length,
      evenements,
    };
  }
  // Créer un événement pour un dossier
  async createEvent(
    dossierId: string,
    createEventDto: CreateEventDto,
    utilisateurId: string,
  ) {
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId, statut: { not: 'SUPPRIME' } },
    });
    if (!dossier) {
      throw new NotFoundException(`Dossier ${dossierId} introuvable`);
    }

    const event = await this.prisma.evenementCalendrier.create({
      data: {
        ...createEventDto,
        dossierId,
        creeParId: utilisateurId,
        statut: StatutEvenement.PREVU,
      },
      include: {
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: { select: { id: true, titre: true, numeroUnique: true } },
      },
    });

    this.logger.log(`✅ Événement créé pour le dossier ${dossierId}`);
    return event;
  }

  // Modifier un événement
  async updateEvent(
    dossierId: string,
    eventId: string,
    updateEventDto: UpdateEventDto,
  ) {
    const event = await this.prisma.evenementCalendrier.findUnique({
      where: { id: eventId },
    });
    if (!event || event.statut === 'SUPPRIME') {
      throw new NotFoundException(
        `Événement ${eventId} introuvable ou supprimé`,
      );
    }

    if (event.dossierId !== dossierId) {
      throw new NotFoundException(
        `Événement ${eventId} n'appartient pas au dossier ${dossierId}`,
      );
    }

    const updated = await this.prisma.evenementCalendrier.update({
      where: { id: eventId },
      data: updateEventDto,
      include: {
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: { select: { id: true, titre: true, numeroUnique: true } },
      },
    });

    this.logger.log(`✅ Événement ${eventId} mis à jour`);
    return updated;
  }

  // Supprimer un événement (soft delete)
  async softDeleteEvent(dossierId: string, eventId: string) {
    const event = await this.prisma.evenementCalendrier.findUnique({
      where: { id: eventId },
    });
    if (!event || event.statut === 'SUPPRIME') {
      throw new NotFoundException(
        `Événement ${eventId} introuvable ou déjà supprimé`,
      );
    }

    if (event.dossierId !== dossierId) {
      throw new NotFoundException(
        `Événement ${eventId} n'appartient pas au dossier ${dossierId}`,
      );
    }

    const deleted = await this.prisma.evenementCalendrier.update({
      where: { id: eventId },
      data: { statut: 'SUPPRIME' },
      include: {
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: { select: { id: true, titre: true, numeroUnique: true } },
      },
    });

    return { message: 'Événement supprimé (soft delete)', event: deleted };
  }
  async assignDossier(id: string, nouveauResponsableId: string) {
    // Vérifier que le dossier existe et n'est pas supprimé
    const dossier = await this.prisma.dossier.findUnique({
      where: { id, statut: { not: 'SUPPRIME' } },
    });
    if (!dossier) {
      this.logger.warn(
        `❌ Tentative de réassignation d’un dossier inexistant: ${id}`,
      );
      throw new NotFoundException(`Dossier avec ID ${id} introuvable`);
    }

    // Vérifier que le nouvel utilisateur existe et est actif
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: nouveauResponsableId, statut: 'ACTIF' },
    });
    if (!utilisateur) {
      this.logger.warn(
        `❌ Utilisateur ${nouveauResponsableId} introuvable ou inactif`,
      );
      throw new NotFoundException(
        `Utilisateur avec ID ${nouveauResponsableId} introuvable ou inactif`,
      );
    }

    // Mettre à jour le responsable
    const updatedDossier = await this.prisma.dossier.update({
      where: { id },
      data: { responsableId: nouveauResponsableId },
      include: {
        client: true,
        responsable: true,
        contentieux: true,
        contrat: true,
        documents: true,
        evenements: true,
        factures: true,
        immobilier: true,
        messages: true,
        sinistreCorporel: true,
        sinistreMateriel: true,
        sinistreMortel: true,
        sport: true,
        taches: true,
        notes: true,
      },
    });

    this.logger.log(
      `✅ Dossier ${id} réassigné à l'utilisateur ${nouveauResponsableId}`,
    );

    return {
      message: `Dossier réassigné avec succès`,
      dossier: updatedDossier,
    };
  }
}
