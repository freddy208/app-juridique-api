/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { UpdatePaiementDto } from './dto/update-paiement.dto';
import { StatutPaiement, StatutFacture, StatutHonoraire } from '@prisma/client';
import { PaginationUtil } from '../common/utils/pagination.util';
import { NotificationsService } from '../notifications/notifications.service';
import {
  PaiementResponse,
  PaiementStatsResponse,
} from './interfaces/paiement.interface';
import { QueryPaiementDto } from './dto/query-paiement.dto';

@Injectable()
export class PaiementsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  // -------------------- CRUD DE BASE --------------------
  async create(
    createPaiementDto: CreatePaiementDto,
  ): Promise<PaiementResponse> {
    const {
      montant,
      factureId,
      honoraireId,
      clientId,
      mode,
      date,
      referenceTransaction,
    } = createPaiementDto;

    // Un paiement doit être lié à au moins une entité
    if (!factureId && !honoraireId && !clientId) {
      throw new Error(
        'Un paiement doit être associé à une facture, un honoraire ou un client.',
      );
    }

    // Vérifier l'existence de l'entité liée
    if (factureId)
      await this.prisma.facture.findUniqueOrThrow({ where: { id: factureId } });
    if (honoraireId)
      await this.prisma.honoraire.findUniqueOrThrow({
        where: { id: honoraireId },
      });
    if (clientId)
      await this.prisma.client.findUniqueOrThrow({ where: { id: clientId } });

    const paiementData: any = {
      montant,
      mode,
      date: date ? new Date(date) : new Date(),
      statut: StatutPaiement.EN_ATTENTE, // Par défaut, un paiement est en attente de validation
    };
    if (factureId) paiementData.factureId = factureId;
    if (honoraireId) paiementData.honoraireId = honoraireId;
    if (clientId) paiementData.clientId = clientId;
    if (referenceTransaction)
      paiementData.referenceTransaction = referenceTransaction;

    const paiement = await this.prisma.paiement.create({
      data: paiementData,
      include: {
        facture: { select: { id: true, numero: true, montantTotal: true } },
        honoraire: { select: { id: true, montantTTC: true } },
        client: {
          select: { id: true, prenom: true, nom: true, entreprise: true },
        },
      },
    });

    await this.invalidatePaiementsCache();
    return this.formatPaiementResponse(paiement);
  }

  async findAll(query: QueryPaiementDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'desc',
      clientId,
      factureId,
      honoraireId,
      statut,
      mode,
      dateMin,
      dateMax,
    } = query;

    const cacheKey = `paiements:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) return cachedResult;

    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (factureId) where.factureId = factureId;
    if (honoraireId) where.honoraireId = honoraireId;
    if (statut) where.statut = statut;
    if (mode) where.mode = mode;
    if (dateMin || dateMax) {
      where.date = {};
      if (dateMin) where.date.gte = new Date(dateMin);
      if (dateMax) where.date.lte = new Date(dateMax);
    }

    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const [paiements, total] = await Promise.all([
      this.prisma.paiement.findMany({
        where,
        ...paginationParams,
        include: {
          facture: { select: { id: true, numero: true, montantTotal: true } },
          honoraire: { select: { id: true, montantTTC: true } },
          client: {
            select: { id: true, prenom: true, nom: true, entreprise: true },
          },
        },
      }),
      this.prisma.paiement.count({ where }),
    ]);

    const formattedPaiements = paiements.map((p) =>
      this.formatPaiementResponse(p),
    );
    const result = PaginationUtil.createPaginationResult(
      formattedPaiements,
      total,
      { page, limit, sortBy, sortOrder },
    );

    await this.cacheManager.set(cacheKey, result, 300); // 5 minutes
    return result;
  }

  async findOne(id: string): Promise<PaiementResponse> {
    const cacheKey = `paiement:${id}`;
    const cachedPaiement = await this.cacheManager.get(cacheKey);
    if (cachedPaiement) return cachedPaiement as PaiementResponse;

    const paiement = await this.prisma.paiement.findUnique({
      where: { id },
      include: {
        facture: { select: { id: true, numero: true, montantTotal: true } },
        honoraire: { select: { id: true, montantTTC: true } },
        client: {
          select: { id: true, prenom: true, nom: true, entreprise: true },
        },
      },
    });

    if (!paiement)
      throw new NotFoundException(`Paiement avec l'ID ${id} non trouvé`);

    await this.cacheManager.set(cacheKey, paiement, 600); // 10 minutes
    return this.formatPaiementResponse(paiement);
  }

  async update(
    id: string,
    updatePaiementDto: UpdatePaiementDto,
  ): Promise<PaiementResponse> {
    const existingPaiement = await this.prisma.paiement.findUnique({
      where: { id },
    });
    if (!existingPaiement)
      throw new NotFoundException(`Paiement avec l'ID ${id} non trouvé`);

    const updatedPaiement = await this.prisma.paiement.update({
      where: { id },
      data: updatePaiementDto,
      include: {
        facture: { select: { id: true, numero: true, montantTotal: true } },
        honoraire: { select: { id: true, montantTTC: true } },
        client: {
          select: { id: true, prenom: true, nom: true, entreprise: true },
        },
      },
    });

    await this.cacheManager.del(`paiement:${id}`);
    await this.invalidatePaiementsCache();
    return this.formatPaiementResponse(updatedPaiement);
  }

  async remove(id: string): Promise<void> {
    const existingPaiement = await this.prisma.paiement.findUnique({
      where: { id },
    });
    if (!existingPaiement)
      throw new NotFoundException(`Paiement avec l'ID ${id} non trouvé`);

    // Si le paiement était validé, il faut mettre à jour le statut de la facture/honoraire
    if (existingPaiement.statut === StatutPaiement.VALIDE) {
      if (existingPaiement.factureId) {
        await this.updateFactureStatut(existingPaiement.factureId);
      }
      if (existingPaiement.honoraireId) {
        await this.updateHonoraireStatut(existingPaiement.honoraireId);
      }
    }

    await this.prisma.paiement.delete({ where: { id } });
    await this.cacheManager.del(`paiement:${id}`);
    await this.invalidatePaiementsCache();
  }

  // -------------------- MÉTHODES SPÉCIFIQUES --------------------

  async validerPaiement(id: string): Promise<PaiementResponse> {
    const paiement = await this.prisma.paiement.update({
      where: { id },
      data: { statut: StatutPaiement.VALIDE },
      include: {
        facture: {
          select: {
            id: true,
            numero: true,
            montantTotal: true,
            clientId: true,
          },
        },
        honoraire: { select: { id: true, montantTTC: true, clientId: true } },
        client: {
          select: { id: true, prenom: true, nom: true, entreprise: true },
        },
      },
    });

    // Mettre à jour le statut de la facture ou de l'honoraire associé
    if (paiement.factureId) {
      await this.updateFactureStatut(paiement.factureId);
    }
    if (paiement.honoraireId) {
      await this.updateHonoraireStatut(paiement.honoraireId);
    }

    await this.cacheManager.del(`paiement:${id}`);
    await this.invalidatePaiementsCache();
    return this.formatPaiementResponse(paiement);
  }

  async rejeterPaiement(id: string, motif: string): Promise<PaiementResponse> {
    const paiement = await this.prisma.paiement.update({
      where: { id },
      data: { statut: StatutPaiement.REJETE }, // 'motifRejet' a été retiré
      include: {
        facture: { select: { id: true, numero: true, montantTotal: true } },
        honoraire: { select: { id: true, montantTTC: true } },
        client: {
          select: { id: true, prenom: true, nom: true, entreprise: true },
        },
      },
    });

    await this.cacheManager.del(`paiement:${id}`);
    await this.invalidatePaiementsCache();
    return this.formatPaiementResponse(paiement);
  }

  async getStats(): Promise<PaiementStatsResponse> {
    const cacheKey = 'paiements-stats';
    const cachedStats = await this.cacheManager.get(cacheKey);
    if (cachedStats) return cachedStats as PaiementStatsResponse;

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalEncaisse,
      totalEnAttente,
      totalRejete,
      paiementsGroupes,
      repartitionParMode,
      topClients,
      facturesImpayees,
      honorairesImpayes,
    ] = await Promise.all([
      this.prisma.paiement.aggregate({
        _sum: { montant: true },
        where: { statut: StatutPaiement.VALIDE },
      }),
      this.prisma.paiement.aggregate({
        _sum: { montant: true },
        where: { statut: StatutPaiement.EN_ATTENTE },
      }),
      this.prisma.paiement.aggregate({
        _sum: { montant: true },
        where: { statut: StatutPaiement.REJETE },
      }),
      this.prisma.$queryRaw`
        SELECT 
          TO_CHAR(date, 'YYYY-MM') as mois,
          SUM(montant) as montant,
          COUNT(id)::int as nombre
        FROM "Paiement" 
        WHERE statut = 'VALIDE' AND date >= ${startOfYear}
        GROUP BY TO_CHAR(date, 'YYYY-MM')
        ORDER BY mois DESC
      ` as unknown as { mois: string; montant: bigint; nombre: number }[],
      this.prisma.paiement.groupBy({
        by: ['mode'],
        _sum: { montant: true },
        where: { statut: StatutPaiement.VALIDE },
      }),
      this.prisma.$queryRaw`
        SELECT 
          c.id, c.prenom, c.nom, c.entreprise,
          COALESCE(SUM(p.montant), 0) as "totalVerse"
        FROM "Paiement" p
        JOIN "Client" c ON p."clientId" = c.id
        WHERE p.statut = 'VALIDE'
        GROUP BY c.id, c.prenom, c.nom, c.entreprise
        ORDER BY "totalVerse" DESC
        LIMIT 10
      ` as unknown as {
        id: string;
        prenom: string;
        nom: string;
        entreprise: string | null;
        totalVerse: bigint;
      }[],
      this.prisma.facture.aggregate({
        _sum: { montantTotal: true, montantPaye: true },
        _count: true,
        where: {
          statut: {
            in: [
              StatutFacture.IMPAYEE,
              StatutFacture.EN_RETARD,
              StatutFacture.PARTIELLE,
            ],
          },
        },
      }),
      this.prisma.honoraire.aggregate({
        _sum: { montantTTC: true },
        _count: true,
        where: {
          statut: {
            in: [StatutHonoraire.EMIS, StatutHonoraire.PARTIELLEMENT_PAYE],
          },
        },
      }),
    ]);

    const totalEncaisseMontant = Number(totalEncaisse._sum.montant || 0);
    const totalEnAttenteMontant = Number(totalEnAttente._sum.montant || 0);
    const totalRejeteMontant = Number(totalRejete._sum.montant || 0);

    const totalTousModes = repartitionParMode.reduce(
      (acc, item) => acc + Number(item._sum.montant),
      0,
    );

    const topClientsCorriges = (
      topClients as {
        id: string;
        prenom: string;
        nom: string;
        entreprise: string | null;
        totalVerse: bigint;
      }[]
    ).map((c) => ({
      ...c,
      entreprise: c.entreprise ?? undefined, // Convertit null en undefined
      totalVerse: Number(c.totalVerse),
    }));

    const stats: PaiementStatsResponse = {
      totalEncaisse: totalEncaisseMontant,
      totalEnAttente: totalEnAttenteMontant,
      totalRejete: totalRejeteMontant,
      paiementsParMois: paiementsGroupes.map((p) => ({
        mois: p.mois,
        montant: Number(p.montant),
        nombre: p.nombre,
      })),
      repartitionParMode: repartitionParMode.map((item) => ({
        mode: item.mode,
        montant: Number(item._sum.montant),
        pourcentage:
          totalTousModes > 0
            ? (Number(item._sum.montant) / totalTousModes) * 100
            : 0,
      })),
      topClients: topClientsCorriges, // Utilisation du tableau corrigé
      facturesImpayees: {
        count: facturesImpayees._count,
        montantTotal:
          Number(facturesImpayees._sum.montantTotal) -
          Number(facturesImpayees._sum.montantPaye),
      },
      honorairesImpayes: {
        count: honorairesImpayes._count,
        montantTotal: Number(honorairesImpayes._sum.montantTTC),
      },
    };

    await this.cacheManager.set(cacheKey, stats, 600); // 10 minutes
    return stats;
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private formatPaiementResponse(paiement: any): PaiementResponse {
    return paiement;
  }

  private async updateFactureStatut(factureId: string) {
    const facture = await this.prisma.facture.findUnique({
      where: { id: factureId },
    });
    if (!facture) return;

    const paiements = await this.prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { factureId, statut: StatutPaiement.VALIDE },
    });

    const totalPaye = Number(paiements._sum.montant || 0);
    let nouveauStatut = facture.statut;

    if (totalPaye >= facture.montantTotal) {
      nouveauStatut = StatutFacture.PAYEE;
    } else if (totalPaye > 0) {
      nouveauStatut = StatutFacture.PARTIELLE;
    } else {
      nouveauStatut = StatutFacture.IMPAYEE;
    }

    if (nouveauStatut !== facture.statut) {
      await this.prisma.facture.update({
        where: { id: factureId },
        data: { statut: nouveauStatut, montantPaye: totalPaye },
      });
    } else {
      await this.prisma.facture.update({
        where: { id: factureId },
        data: { montantPaye: totalPaye },
      });
    }
  }

  private async updateHonoraireStatut(honoraireId: string) {
    const honoraire = await this.prisma.honoraire.findUnique({
      where: { id: honoraireId },
    });
    if (!honoraire) return;

    const paiements = await this.prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { honoraireId, statut: StatutPaiement.VALIDE },
    });

    const totalPaye = Number(paiements._sum.montant || 0);
    let nouveauStatut = honoraire.statut;

    if (totalPaye >= Number(honoraire.montantTTC)) {
      nouveauStatut = StatutHonoraire.PAYE;
    } else if (totalPaye > 0) {
      nouveauStatut = StatutHonoraire.PARTIELLEMENT_PAYE;
    } else {
      nouveauStatut = StatutHonoraire.EMIS;
    }

    if (nouveauStatut !== honoraire.statut) {
      await this.prisma.honoraire.update({
        where: { id: honoraireId },
        data: { statut: nouveauStatut },
      });
    }
  }

  private async invalidatePaiementsCache(): Promise<void> {
    try {
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores)
      ) {
        const store = this.cacheManager.stores[0];
        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('paiements:*');
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
        "Erreur lors de l'invalidation du cache des paiements:",
        error,
      );
    }
  }
}
