/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateFactureDto } from './dto/create-facture.dto';
import { UpdateFactureDto } from './dto/update-facture.dto';
import { StatutFacture, StatutLigneFacture } from '@prisma/client';
import { PaginationUtil } from '../common/utils/pagination.util';
import { NotificationsService } from '../notifications/notifications.service';
import { PaiementsService } from '../paiments/paiments.service';
import {
  FactureResponse,
  FactureStatsResponse,
} from './interfaces/facture-response.interface';
import { QueryFactureDto } from './dto/query-facture.dto';

@Injectable()
export class FacturesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => PaiementsService))
    private paiementsService: PaiementsService,
  ) {}

  // -------------------- CRUD DE BASE --------------------
  async create(createFactureDto: CreateFactureDto): Promise<FactureResponse> {
    const { clientId, dossierId, dateEcheance, lignes } = createFactureDto;

    // Vérifier l'existence du client et du dossier
    await this.prisma.client.findUniqueOrThrow({ where: { id: clientId } });
    if (dossierId) {
      await this.prisma.dossier.findUniqueOrThrow({ where: { id: dossierId } });
    }

    const numero = await this.generateNumeroFacture();
    const montantTotal = lignes.reduce(
      (sum, ligne) => sum + ligne.quantite * ligne.prixUnitaire,
      0,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const newFacture = await tx.facture.create({
        data: {
          clientId,
          dossierId,
          numero,
          dateEcheance: dateEcheance ? new Date(dateEcheance) : null,
          montantTotal,
          statut: StatutFacture.BROUILLON,
        },
      });

      await tx.ligneFacture.createMany({
        data: lignes.map((ligne) => ({
          factureId: newFacture.id,
          description: ligne.description,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          montant: ligne.quantite * ligne.prixUnitaire,
          statut: StatutLigneFacture.ACTIF, // <-- AJOUT
        })),
      });

      return newFacture;
    });

    await this.invalidateFacturesCache();
    return this.findOne(result.id); // Récupérer la facture complète avec les relations
  }

  async findAll(query: QueryFactureDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'dateEmission',
      sortOrder = 'desc',
      clientId,
      dossierId,
      statut,
      dateMin,
      dateMax,
    } = query;

    const cacheKey = `factures:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) return cachedResult;

    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (dossierId) where.dossierId = dossierId;
    if (statut) where.statut = statut;
    if (dateMin || dateMax) {
      where.dateEmission = {};
      if (dateMin) where.dateEmission.gte = new Date(dateMin);
      if (dateMax) where.dateEmission.lte = new Date(dateMax);
    }

    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const [factures, total] = await Promise.all([
      this.prisma.facture.findMany({
        where,
        ...paginationParams,
        include: {
          client: {
            select: { id: true, prenom: true, nom: true, entreprise: true },
          },
          dossier: { select: { id: true, numeroUnique: true, titre: true } },
          lignes: true,
        },
      }),
      this.prisma.facture.count({ where }),
    ]);

    const formattedFactures = factures.map((f) =>
      this.formatFactureResponse(f),
    );
    const result = PaginationUtil.createPaginationResult(
      formattedFactures,
      total,
      { page, limit, sortBy, sortOrder },
    );

    await this.cacheManager.set(cacheKey, result, 300);
    return result;
  }

  async findOne(id: string): Promise<FactureResponse> {
    const cacheKey = `facture:${id}`;
    const cachedFacture = await this.cacheManager.get(cacheKey);
    if (cachedFacture) return cachedFacture as FactureResponse;

    const facture = await this.prisma.facture.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, prenom: true, nom: true, entreprise: true },
        },
        dossier: { select: { id: true, numeroUnique: true, titre: true } },
        lignes: true,
      },
    });

    if (!facture)
      throw new NotFoundException(`Facture avec l'ID ${id} non trouvée`);

    await this.cacheManager.set(cacheKey, facture, 600);
    return this.formatFactureResponse(facture);
  }

  async update(
    id: string,
    updateFactureDto: UpdateFactureDto,
  ): Promise<FactureResponse> {
    const existingFacture = await this.prisma.facture.findUnique({
      where: { id },
      include: { lignes: true },
    });
    if (!existingFacture)
      throw new NotFoundException(`Facture avec l'ID ${id} non trouvée`);

    const { lignes, ...restOfData } = updateFactureDto;

    // CORRECTION 3 : Typer `factureData` en `any` pour permettre l'ajout dynamique de `montantTotal`
    const factureData: any = { ...restOfData };

    const result = await this.prisma.$transaction(async (tx) => {
      // Si des lignes sont fournies, on les remplace
      if (lignes) {
        await tx.ligneFacture.deleteMany({ where: { factureId: id } });
        await tx.ligneFacture.createMany({
          data: lignes.map((ligne) => ({
            factureId: id,
            description: ligne.description || '',
            // CORRECTION 2 : Fournir des valeurs par défaut pour les champs optionnels
            quantite: ligne.quantite ?? 1, // <-- AJOUT
            prixUnitaire: ligne.prixUnitaire ?? 0, // <-- AJOUT
            montant: (ligne.quantite ?? 1) * (ligne.prixUnitaire ?? 0), // <-- MODIFIÉ
            statut: StatutLigneFacture.ACTIF, // <-- AJOUT
          })),
        });
        // Recalculer le montant total
        const newMontantTotal = lignes.reduce(
          // CORRECTION 2 : Utiliser les mêmes valeurs par défaut pour la cohérence
          (sum, ligne) =>
            sum + (ligne.quantite ?? 1) * (ligne.prixUnitaire ?? 0),
          0,
        );
        factureData.montantTotal = newMontantTotal;
      }

      return await tx.facture.update({
        where: { id },
        data: factureData,
        include: {
          client: {
            select: { id: true, prenom: true, nom: true, entreprise: true },
          },
          dossier: { select: { id: true, numeroUnique: true, titre: true } },
          lignes: true,
        },
      });
    });

    await this.cacheManager.del(`facture:${id}`);
    await this.invalidateFacturesCache();
    return this.formatFactureResponse(result);
  }

  async remove(id: string): Promise<void> {
    const existingFacture = await this.prisma.facture.findUnique({
      where: { id },
    });
    if (!existingFacture)
      throw new NotFoundException(`Facture avec l'ID ${id} non trouvée`);

    // Le `onDelete: Cascade` dans le schéma s'occupera de supprimer les lignes et les paiements associés.
    await this.prisma.facture.delete({ where: { id } });

    await this.cacheManager.del(`facture:${id}`);
    await this.invalidateFacturesCache();
  }

  // -------------------- MÉTHODES SPÉCIFIQUES --------------------

  async envoyerFacture(id: string): Promise<FactureResponse> {
    const facture = await this.prisma.facture.update({
      where: { id },
      data: { statut: StatutFacture.ENVOYEE },
      include: {
        client: {
          select: { id: true, prenom: true, nom: true, entreprise: true },
        },
        dossier: { select: { id: true, numeroUnique: true, titre: true } },
        lignes: true,
      },
    });

    await this.cacheManager.del(`facture:${id}`);
    await this.invalidateFacturesCache();
    return this.formatFactureResponse(facture);
  }

  async getFacturesEnRetard(query: QueryFactureDto) {
    const now = new Date();
    return this.findAll({
      ...query,
      statut: StatutFacture.EN_RETARD,
      dateMax: now.toISOString(), // Factures dont la date d'échéance est passée
    });
  }

  async getStats(): Promise<FactureStatsResponse> {
    const cacheKey = 'factures-stats';
    const cachedStats = await this.cacheManager.get(cacheKey);
    if (cachedStats) return cachedStats as FactureStatsResponse;

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalEmis,
      totalPaye,
      nombreFacturesParStatut,
      chiffreAffairesParMois,
      topClientsFactures,
      facturesEnRetardDetails,
    ] = await Promise.all([
      this.prisma.facture.aggregate({
        _sum: { montantTotal: true },
        where: { statut: { not: StatutFacture.BROUILLON } },
      }),
      this.prisma.facture.aggregate({
        _sum: { montantTotal: true },
        where: { statut: StatutFacture.PAYEE },
      }),
      this.prisma.facture.groupBy({
        by: ['statut'],
        _count: true,
        _sum: { montantTotal: true },
        where: { statut: { not: StatutFacture.BROUILLON } },
      }),
      this.prisma.$queryRaw`
        SELECT 
          TO_CHAR("dateEmission", 'YYYY-MM') as mois,
          SUM("montantTotal") as montant
        FROM "Facture" 
        WHERE statut != 'BROUILLON' AND "dateEmission" >= ${startOfYear}
        GROUP BY TO_CHAR("dateEmission", 'YYYY-MM')
        ORDER BY mois DESC
      ` as unknown as { mois: string; montant: bigint }[],
      this.prisma.$queryRaw`
        SELECT 
          c.id, c.prenom, c.nom, c.entreprise,
          COALESCE(SUM(f."montantTotal"), 0) as "totalFacture"
        FROM "Facture" f
        JOIN "Client" c ON f."clientId" = c.id
        WHERE f.statut != 'BROUILLON'
        GROUP BY c.id, c.prenom, c.nom, c.entreprise
        ORDER BY "totalFacture" DESC
        LIMIT 10
      ` as unknown as {
        id: string;
        prenom: string;
        nom: string;
        entreprise: string | null;
        totalFacture: bigint;
      }[],
      this.prisma.facture.aggregate({
        _sum: { montantTotal: true },
        _count: true,
        where: { statut: StatutFacture.EN_RETARD },
      }),
    ]);

    const totalEmisMontant = Number(totalEmis._sum.montantTotal || 0);
    const totalPayeMontant = Number(totalPaye._sum.montantTotal || 0);
    const totalImpaye = totalEmisMontant - totalPayeMontant;
    const totalEnRetard = Number(
      facturesEnRetardDetails._sum.montantTotal || 0,
    );

    const stats: FactureStatsResponse = {
      totalEmis: totalEmisMontant,
      totalPaye: totalPayeMontant,
      totalEnRetard,
      totalImpaye,
      nombreFacturesParStatut: nombreFacturesParStatut.map((item) => ({
        statut: item.statut,
        count: item._count,
        montantTotal: Number(item._sum.montantTotal),
      })),
      chiffreAffairesParMois: chiffreAffairesParMois.map((c) => ({
        mois: c.mois,
        montant: Number(c.montant),
      })),
      topClientsFactures: topClientsFactures.map((c) => ({
        ...c,
        totalFacture: Number(c.totalFacture),
      })),
      facturesEnRetardDetails: {
        count: facturesEnRetardDetails._count,
        montantTotal: totalEnRetard,
      },
    };

    await this.cacheManager.set(cacheKey, stats, 600);
    return stats;
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private formatFactureResponse(facture: any): FactureResponse {
    const montantRestant = facture.montantTotal - facture.montantPaye;
    const enRetard = facture.dateEcheance
      ? new Date(facture.dateEcheance) < new Date() &&
        facture.statut !== StatutFacture.PAYEE
      : false;

    return {
      ...facture,
      montantRestant,
      enRetard,
    };
  }

  private async generateNumeroFacture(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const counterKey = `F${year}${month}`;

    const counter = await this.prisma.counter.upsert({
      where: { key: counterKey },
      update: { value: { increment: 1 } },
      create: { key: counterKey, value: 1 },
    });

    return `${counterKey}${String(counter.value).padStart(4, '0')}`;
  }

  private async invalidateFacturesCache(): Promise<void> {
    try {
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores)
      ) {
        const store = this.cacheManager.stores[0];
        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('factures:*');
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
        "Erreur lors de l'invalidation du cache des factures:",
        error,
      );
    }
  }
}
