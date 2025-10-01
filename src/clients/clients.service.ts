// src/clients/clients.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FilterClientDto } from './dto/filter-client.dto';

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

    return this.prisma.client.findMany({
      skip,
      take,
      where: {
        statut,
        nomEntreprise: nomEntreprise
          ? { contains: nomEntreprise, mode: 'insensitive' }
          : undefined,
        email: email ? { contains: email, mode: 'insensitive' } : undefined,
        telephone: telephone
          ? { contains: telephone, mode: 'insensitive' }
          : undefined,
        OR: search
          ? [
              { prenom: { contains: search, mode: 'insensitive' } },
              { nom: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
        dossiers: typeDossier
          ? {
              some: { type: typeDossier },
            }
          : undefined,
      },
      include: {
        dossiers: true,
        factures: true,
      },
      orderBy: { creeLe: 'desc' },
    });
  }
}
