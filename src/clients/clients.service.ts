import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FilterClientDto } from './dto/filter-client.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import {
  Prisma,
  StatutClient,
  StatutDossier,
  StatutDocument,
  StatutNote,
} from '@prisma/client';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FilterClientDto) {
    const {
      statut,
      search,
      nomEntreprise,
      email,
      telephone,
      typeDossier,
      statutDossier,
      skip,
      take,
    } = filters;

    const where: Prisma.ClientWhereInput = {};

    if (statut) {
      where.statut = statut;
    }
    if (nomEntreprise) {
      where.nomEntreprise = { contains: nomEntreprise, mode: 'insensitive' };
    }
    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }
    if (telephone) {
      where.telephone = { contains: telephone, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { prenom: { contains: search, mode: 'insensitive' } },
        { nom: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (typeDossier || statutDossier) {
      where.dossiers = {
        some: {
          ...(typeDossier && { type: typeDossier }),
          ...(statutDossier && { statut: statutDossier }),
        },
      };
    }

    // 🔥 On calcule le total AVANT la pagination
    const totalCount = await this.prisma.client.count({ where });

    // 🔥 On récupère la portion demandée
    const data = await this.prisma.client.findMany({
      skip,
      take,
      where,
      include: {
        dossiers: statutDossier ? { where: { statut: statutDossier } } : true,
        factures: true,
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

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        dossiers: true,
        factures: true,
      },
    });

    if (!client) {
      throw new NotFoundException(`Client avec l'id ${id} introuvable`);
    }

    return client;
  }
  async create(data: CreateClientDto) {
    return await this.prisma.client.create({
      data,
      include: {
        dossiers: true,
        factures: true,
      },
    });
  }
  async update(id: string, data: UpdateClientDto) {
    // Vérifier si le client existe
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Client avec l'id ${id} introuvable`);
    }

    // Mise à jour
    return this.prisma.client.update({
      where: { id },
      data,
      include: {
        dossiers: true,
        factures: true,
      },
    });
  }
  // src/clients/clients.service.ts
  async updateStatus(id: string, statut: StatutClient) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Client avec l'id ${id} introuvable`);
    }

    return this.prisma.client.update({
      where: { id },
      data: { statut },
      include: { dossiers: true, factures: true },
    });
  }
  // src/clients/clients.service.ts
  async remove(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Client avec l'id ${id} introuvable`);
    }

    // Soft delete : on passe le statut à INACTIF
    return this.prisma.client.update({
      where: { id },
      data: { statut: StatutClient.INACTIF },
      include: { dossiers: true, factures: true },
    });
  }
  // src/clients/clients.service.ts

  async findDossiersByClient(
    clientId: string,
    statutDossier?: StatutDossier,
    skip?: number,
    take?: number,
  ) {
    const clientExists = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!clientExists) {
      throw new NotFoundException(`Client avec l'id ${clientId} introuvable`);
    }

    const effectiveSkip = skip ?? 0;
    const effectiveTake = take ?? 10;

    const where: Prisma.DossierWhereInput = { clientId };
    if (statutDossier) {
      where.statut = statutDossier;
    }
    const totalCount = await this.prisma.dossier.count({ where });
    const data = await this.prisma.dossier.findMany({
      where,
      skip: effectiveSkip,
      take: effectiveTake,
      include: {
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
        responsable: true,
        client: true,
      },
      orderBy: { creeLe: 'desc' },
    });
    return {
      totalCount,
      skip: effectiveSkip,
      take: effectiveTake,
      data,
    };
  }
  //document
  async findDocumentsByClient(
    clientId: string,
    statut?: StatutDocument,
    skip?: number,
    take?: number,
  ) {
    const clientExists = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!clientExists) {
      throw new NotFoundException(`Client avec l'id ${clientId} introuvable`);
    }

    const effectiveSkip = skip ?? 0;
    const effectiveTake = take ?? 10;

    const where: Prisma.DocumentWhereInput = {
      dossier: { clientId }, // Tous les documents liés aux dossiers du client
      ...(statut && { statut }),
    };

    const totalCount = await this.prisma.document.count({ where });
    const data = await this.prisma.document.findMany({
      where,
      skip: effectiveSkip,
      take: effectiveTake,
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

    return {
      totalCount,
      skip: effectiveSkip,
      take: effectiveTake,
      data,
    };
  }

  // src/clients/clients.service.ts
  async findNotesByClient(clientId: string, skip?: number, take?: number) {
    const clientExists = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!clientExists) {
      throw new NotFoundException(`Client avec l'id ${clientId} introuvable`);
    }

    const effectiveSkip = skip ?? 0;
    const effectiveTake = take ?? 10;

    const where: Prisma.NoteWhereInput = { clientId, statut: StatutNote.ACTIF };

    const totalCount = await this.prisma.note.count({ where });
    const data = await this.prisma.note.findMany({
      where,
      skip: effectiveSkip,
      take: effectiveTake,
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: {
          select: { id: true, numeroUnique: true, titre: true },
        },
      },
      orderBy: { creeLe: 'desc' },
    });

    return {
      totalCount,
      skip: effectiveSkip,
      take: effectiveTake,
      data,
    };
  }
  async createNote(
    clientId: string,
    utilisateurId: string,
    dto: CreateNoteDto,
  ) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException(`Client avec l'id ${clientId} introuvable`);
    }

    if (dto.dossierId) {
      const dossier = await this.prisma.dossier.findUnique({
        where: { id: dto.dossierId },
      });
      if (!dossier) {
        throw new NotFoundException(
          `Dossier avec l'id ${dto.dossierId} introuvable`,
        );
      }
    }

    return this.prisma.note.create({
      data: {
        clientId,
        dossierId: dto.dossierId,
        utilisateurId,
        contenu: dto.contenu,
      },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: { select: { id: true, numeroUnique: true, titre: true } },
        client: {
          select: { id: true, prenom: true, nom: true, nomEntreprise: true },
        },
      },
    });
  }

  // Modifier une note
  async updateNote(noteId: string, utilisateurId: string, dto: UpdateNoteDto) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note) {
      throw new NotFoundException(`Note avec l'id ${noteId} introuvable`);
    }

    // Optionnel : vérifier que l'utilisateur est le créateur
    if (note.utilisateurId !== utilisateurId) {
      throw new NotFoundException(
        `Vous n'avez pas le droit de modifier cette note`,
      );
    }

    return this.prisma.note.update({
      where: { id: noteId },
      data: { contenu: dto.contenu },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: { select: { id: true, numeroUnique: true, titre: true } },
        client: {
          select: { id: true, prenom: true, nom: true, nomEntreprise: true },
        },
      },
    });
  }

  // Supprimer une note
  async removeNote(noteId: string, utilisateurId: string) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note) {
      throw new NotFoundException(`Note avec l'id ${noteId} introuvable`);
    }

    if (note.utilisateurId !== utilisateurId) {
      throw new NotFoundException(
        `Vous n'avez pas le droit de supprimer cette note`,
      );
    }

    return this.prisma.note.update({
      where: { id: noteId },
      data: { statut: StatutNote.SUPPRIME },
    });
  }
}
