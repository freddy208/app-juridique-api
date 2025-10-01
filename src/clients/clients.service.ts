import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FilterClientDto } from './dto/filter-client.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Prisma, StatutClient } from '@prisma/client';

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
      skip,
      take,
    } = filters;
    const effectiveSkip = skip ?? 0;
    const effectiveTake = take ?? 10;

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
    if (typeDossier) {
      where.dossiers = { some: { type: typeDossier } };
    }

    return this.prisma.client.findMany({
      skip: effectiveSkip,
      take: effectiveTake,
      where,
      include: {
        dossiers: true,
        factures: true,
      },
      orderBy: { creeLe: 'desc' },
    });
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
}
