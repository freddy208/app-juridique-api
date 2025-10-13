import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CustomReportDto } from './dto/custom-report.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDossiersStats() {
    try {
      // Comptage par statut
      const statsParStatut = await this.prisma.dossier.groupBy({
        by: ['statut'],
        _count: { id: true },
      });

      // Comptage par type
      const statsParType = await this.prisma.dossier.groupBy({
        by: ['type'],
        _count: { id: true },
      });

      // Total dossiers
      const total = await this.prisma.dossier.count();

      return {
        parStatut: statsParStatut.reduce(
          (acc, cur) => {
            acc[cur.statut] = cur._count.id;
            return acc;
          },
          {} as Record<string, number>,
        ),
        parType: statsParType.reduce(
          (acc, cur) => {
            acc[cur.type] = cur._count.id;
            return acc;
          },
          {} as Record<string, number>,
        ),
        total,
      };
    } catch (error) {
      console.error('Erreur récupération stats dossiers:', error);
      throw new BadRequestException(
        'Impossible de récupérer les statistiques des dossiers',
      );
    }
  }
  async getTasksStats() {
    try {
      // Groupement par collaborateur et par statut
      const stats = await this.prisma.tache.groupBy({
        by: ['assigneeId', 'statut'],
        _count: { id: true },
      });

      // Retirer les nulls et garantir le type string[]
      const userIds: string[] = stats
        .map((s) => s.assigneeId)
        .filter((id): id is string => id !== null);

      const users = await this.prisma.utilisateur.findMany({
        where: { id: { in: userIds } },
        select: { id: true, prenom: true, nom: true, email: true },
      });

      // Structurer les stats par collaborateur
      const result: Record<string, any> = {};
      users.forEach((u) => {
        result[u.id] = { user: u, stats: {} as Record<string, number> };
      });

      stats.forEach((s) => {
        if (s.assigneeId) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          result[s.assigneeId].stats[s.statut] = s._count.id;
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return Object.values(result);
    } catch (error) {
      console.error('Erreur récupération stats tâches:', error);
      throw new BadRequestException(
        'Impossible de récupérer les statistiques des tâches',
      );
    }
  }
  async getCustomReport(filters: CustomReportDto) {
    try {
      const where: Prisma.DossierWhereInput = {};

      if (filters.type) {
        where.type = filters.type;
      }
      if (filters.statut) {
        where.statut = filters.statut;
      }
      if (filters.responsableId) {
        where.responsableId = filters.responsableId;
      }
      if (filters.clientId) {
        where.clientId = filters.clientId;
      }
      if (filters.titreContains) {
        where.titre = { contains: filters.titreContains, mode: 'insensitive' };
      }
      if (filters.creeLeStart || filters.creeLeEnd) {
        where.creeLe = {};
        if (filters.creeLeStart) {
          where.creeLe.gte = new Date(filters.creeLeStart);
        }
        if (filters.creeLeEnd) {
          where.creeLe.lte = new Date(filters.creeLeEnd);
        }
      }

      const dossiers = await this.prisma.dossier.findMany({
        where,
        include: {
          client: true,
          responsable: true,
        },
        orderBy: { creeLe: 'desc' },
      });

      return dossiers;
    } catch (error) {
      console.error('Erreur récupération rapport personnalisé:', error);
      throw new BadRequestException(
        'Impossible de générer le rapport personnalisé',
      );
    }
  }
  async getFinanceReport(filters?: {
    clientId?: string;
    start?: string;
    end?: string;
  }) {
    try {
      const where: Prisma.FactureWhereInput = {};

      if (filters?.clientId) {
        where.clientId = filters.clientId;
      }
      if (filters?.start || filters?.end) {
        where.dateEcheance = {};
        if (filters.start) where.dateEcheance.gte = new Date(filters.start);
        if (filters.end) where.dateEcheance.lte = new Date(filters.end);
      }

      const factures = await this.prisma.facture.findMany({
        where,
        include: { client: true, dossier: true },
      });

      const totalRevenu = factures
        .filter((f) => f.payee)
        .reduce((acc, f) => acc + Number(f.montant), 0);

      const statsParStatut = factures.reduce(
        (acc, f) => {
          acc[f.statut] = (acc[f.statut] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        totalFactures: factures.length,
        totalRevenu,
        statsParStatut,
        factures,
      };
    } catch (error) {
      console.error('Erreur récupération rapport financier:', error);
      throw new BadRequestException(
        'Impossible de récupérer le rapport financier',
      );
    }
  }
}
