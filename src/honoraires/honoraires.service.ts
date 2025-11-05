/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateHonoraireDto } from './dto/create-honoraire.dto';
import { UpdateHonoraireDto } from './dto/update-honoraire.dto';
import { ModeCalculHonoraire, StatutHonoraire } from '@prisma/client';
import { PaginationUtil } from '../common/utils/pagination.util';
import { NotificationsService } from '../notifications/notifications.service';
import { PaiementsService } from '../paiments/paiments.service';
import Decimal from 'decimal.js';
import {
  HonoraireResponse,
  HonoraireStatsResponse,
  BaremeOHADA,
} from './interfaces/honoraire-response.interface';
import { QueryHonoraireDto } from './dto/query-honoraire.dto';

@Injectable()
export class HonorairesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => PaiementsService))
    private paiementsService: PaiementsService,
  ) {}

  // -------------------- CRUD DE BASE --------------------
  async create(
    createHonoraireDto: CreateHonoraireDto,
  ): Promise<HonoraireResponse> {
    const {
      dossierId,
      clientId,
      montantHT,
      tauxTVA = 19.25,
      typeHonoraire,
      modeCalcul,
      baremeOHADA,
      dateEcheance,
    } = createHonoraireDto;

    // Vérifier l'existence du dossier et du client
    await this.prisma.dossier.findUniqueOrThrow({ where: { id: dossierId } });
    await this.prisma.client.findUniqueOrThrow({ where: { id: clientId } });

    // Calculer les montants TVA et TTC
    const montantTVA = montantHT * (tauxTVA / 100);
    const montantTTC = montantHT + montantTVA;

    // Si le mode de calcul est basé sur un barème OHADA, valider la référence
    if (modeCalcul === ModeCalculHonoraire.BAREME_OHADA && !baremeOHADA) {
      throw new BadRequestException(
        'Une référence au barème OHADA est requise pour ce mode de calcul',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      return await tx.honoraire.create({
        data: {
          dossierId,
          clientId,
          montantHT,
          tauxTVA,
          montantTVA,
          montantTTC,
          typeHonoraire,
          modeCalcul,
          baremeOHADA,
          dateEcheance: dateEcheance
            ? new Date(dateEcheance)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours par défaut
          statut: StatutHonoraire.EMIS,
        },
      });
    });

    await this.invalidateHonorairesCache();
    return this.findOne(result.id); // Récupérer l'honoraire complet avec les relations
  }

  async findAll(query: QueryHonoraireDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'dateEmission',
      sortOrder = 'desc',
      clientId,
      dossierId,
      statut,
      typeHonoraire,
      dateMin,
      dateMax,
    } = query;

    const cacheKey = `honoraires:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) return cachedResult;

    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (dossierId) where.dossierId = dossierId;
    if (statut) where.statut = statut;
    if (typeHonoraire) where.typeHonoraire = typeHonoraire;
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

    const [honoraires, total] = await Promise.all([
      this.prisma.honoraire.findMany({
        where,
        ...paginationParams,
        include: {
          client: {
            select: { id: true, prenom: true, nom: true, entreprise: true },
          },
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
              responsableId: true,
            },
          },
          paiements: true,
        },
      }),
      this.prisma.honoraire.count({ where }),
    ]);

    const formattedHonoraires = honoraires.map((h) =>
      this.formatHonoraireResponse(h),
    );
    const result = PaginationUtil.createPaginationResult(
      formattedHonoraires,
      total,
      { page, limit, sortBy, sortOrder },
    );

    await this.cacheManager.set(cacheKey, result, 300);
    return result;
  }

  async findOne(id: string): Promise<HonoraireResponse> {
    const cacheKey = `honoraire:${id}`;
    const cachedHonoraire = await this.cacheManager.get(cacheKey);
    if (cachedHonoraire) return cachedHonoraire as HonoraireResponse;

    const honoraire = await this.prisma.honoraire.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, prenom: true, nom: true, entreprise: true },
        },
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            responsableId: true,
          },
        },
        paiements: true,
      },
    });

    if (!honoraire)
      throw new NotFoundException(`Honoraire avec l'ID ${id} non trouvé`);

    await this.cacheManager.set(cacheKey, honoraire, 600);
    return this.formatHonoraireResponse(honoraire);
  }

  async update(
    id: string,
    updateHonoraireDto: UpdateHonoraireDto,
  ): Promise<HonoraireResponse> {
    const existingHonoraire = await this.prisma.honoraire.findUnique({
      where: { id },
      include: { paiements: true },
    });
    if (!existingHonoraire)
      throw new NotFoundException(`Honoraire avec l'ID ${id} non trouvé`);

    // Si le montant HT est modifié, recalculer TVA et TTC
    let honoraireData: any = { ...updateHonoraireDto };

    if (updateHonoraireDto.montantHT !== undefined) {
      // Récupère les valeurs, elles peuvent être number ou Decimal
      const tauxTVATemp =
        updateHonoraireDto.tauxTVA ?? existingHonoraire.tauxTVA;
      const montantHTTemp = updateHonoraireDto.montantHT;

      // Convertit tout en objets Decimal pour des calculs précis
      const tauxTVADecimal = new Decimal(tauxTVATemp);
      const montantHTDecimal = new Decimal(montantHTTemp);

      // Utilise les méthodes de l'objet Decimal
      const montantTVADecimal = montantHTDecimal.mul(tauxTVADecimal.div(100));
      const montantTTCDecimal = montantHTDecimal.plus(montantTVADecimal);

      honoraireData = {
        ...honoraireData,
        tauxTVA: tauxTVATemp, // On garde le type original si besoin
        montantTVA: montantTVADecimal.toNumber(), // Convertit le résultat en number standard
        montantTTC: montantTTCDecimal.toNumber(), // Convertit le résultat en number standard
      };
    }

    // Si le mode de calcul est basé sur un barème OHADA, valider la référence
    if (
      honoraireData.modeCalcul === ModeCalculHonoraire.BAREME_OHADA &&
      !honoraireData.baremeOHADA &&
      !existingHonoraire.baremeOHADA
    ) {
      throw new BadRequestException(
        'Une référence au barème OHADA est requise pour ce mode de calcul',
      );
    }

    const result = await this.prisma.honoraire.update({
      where: { id },
      data: honoraireData,
      include: {
        client: {
          select: { id: true, prenom: true, nom: true, entreprise: true },
        },
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            responsableId: true,
          },
        },
        paiements: true,
      },
    });

    await this.cacheManager.del(`honoraire:${id}`);
    await this.invalidateHonorairesCache();
    return this.formatHonoraireResponse(result);
  }

  async remove(id: string): Promise<void> {
    const existingHonoraire = await this.prisma.honoraire.findUnique({
      where: { id },
    });
    if (!existingHonoraire)
      throw new NotFoundException(`Honoraire avec l'ID ${id} non trouvé`);

    // Vérifier s'il y a des paiements associés
    const paiementsCount = await this.prisma.paiement.count({
      where: { honoraireId: id },
    });

    if (paiementsCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer cet honoraire car il a ${paiementsCount} paiement(s) associé(s)`,
      );
    }

    await this.prisma.honoraire.delete({ where: { id } });

    await this.cacheManager.del(`honoraire:${id}`);
    await this.invalidateHonorairesCache();
  }

  // -------------------- MÉTHODES SPÉCIFIQUES --------------------

  async getHonorairesEnRetard(query: QueryHonoraireDto) {
    const now = new Date();
    return this.findAll({
      ...query,
      statut: StatutHonoraire.EMIS,
      dateMax: now, // Honoraires dont la date d'échéance est passée
    });
  }

  async getStats(): Promise<HonoraireStatsResponse> {
    const cacheKey = 'honoraires-stats';
    const cachedStats = await this.cacheManager.get(cacheKey);
    if (cachedStats) return cachedStats as HonoraireStatsResponse;

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalEmis,
      totalPaye,
      nombreHonorairesParStatut,
      nombreHonorairesParType,
      chiffreAffairesParMois,
      topClientsHonoraires,
      honorairesEnRetardDetails,
    ] = await Promise.all([
      this.prisma.honoraire.aggregate({
        _sum: { montantTTC: true },
        where: { statut: { not: StatutHonoraire.ANNULE } },
      }),
      this.prisma.honoraire.aggregate({
        _sum: { montantTTC: true },
        where: { statut: StatutHonoraire.PAYE },
      }),
      this.prisma.honoraire.groupBy({
        by: ['statut'],
        _count: true,
        _sum: { montantTTC: true },
        where: { statut: { not: StatutHonoraire.ANNULE } },
      }),
      this.prisma.honoraire.groupBy({
        by: ['typeHonoraire'],
        _count: true,
        _sum: { montantTTC: true },
        where: { statut: { not: StatutHonoraire.ANNULE } },
      }),
      this.prisma.$queryRaw`
        SELECT 
          TO_CHAR("dateEmission", 'YYYY-MM') as mois,
          SUM("montantTTC") as montant
        FROM "Honoraire" 
        WHERE statut != 'ANNULE' AND "dateEmission" >= ${startOfYear}
        GROUP BY TO_CHAR("dateEmission", 'YYYY-MM')
        ORDER BY mois DESC
      ` as unknown as { mois: string; montant: bigint }[],
      this.prisma.$queryRaw`
        SELECT 
          c.id, c.prenom, c.nom, c.entreprise,
          COALESCE(SUM(h."montantTTC"), 0) as "totalHonoraire"
        FROM "Honoraire" h
        JOIN "Client" c ON h."clientId" = c.id
        WHERE h.statut != 'ANNULE'
        GROUP BY c.id, c.prenom, c.nom, c.entreprise
        ORDER BY "totalHonoraire" DESC
        LIMIT 10
      ` as unknown as {
        id: string;
        prenom: string;
        nom: string;
        entreprise: string | null;
        totalHonoraire: bigint;
      }[],
      this.prisma.honoraire.aggregate({
        _sum: { montantTTC: true },
        _count: true,
        where: {
          statut: StatutHonoraire.EMIS,
          dateEcheance: { lt: now },
        },
      }),
    ]);

    const totalEmisMontant = Number(totalEmis._sum.montantTTC || 0);
    const totalPayeMontant = Number(totalPaye._sum.montantTTC || 0);
    const totalImpaye = totalEmisMontant - totalPayeMontant;
    const totalEnRetard = Number(
      honorairesEnRetardDetails._sum.montantTTC || 0,
    );

    const stats: HonoraireStatsResponse = {
      totalEmis: totalEmisMontant,
      totalPaye: totalPayeMontant,
      totalEnRetard,
      totalImpaye,
      nombreHonorairesParStatut: nombreHonorairesParStatut.map((item) => ({
        statut: item.statut,
        count: item._count,
        montantTotal: Number(item._sum.montantTTC),
      })),
      nombreHonorairesParType: nombreHonorairesParType.map((item) => ({
        type: item.typeHonoraire,
        count: item._count,
        montantTotal: Number(item._sum.montantTTC),
      })),
      chiffreAffairesParMois: chiffreAffairesParMois.map((c) => ({
        mois: c.mois,
        montant: Number(c.montant),
      })),
      topClientsHonoraires: topClientsHonoraires.map((c) => ({
        ...c,
        totalHonoraire: Number(c.totalHonoraire),
      })),
      honorairesEnRetardDetails: {
        count: honorairesEnRetardDetails._count,
        montantTotal: totalEnRetard,
      },
    };

    await this.cacheManager.set(cacheKey, stats, 600);
    return stats;
  }

  async getBaremesOHADA(): Promise<BaremeOHADA[]> {
    const cacheKey = 'baremes-ohada';
    const cachedBaremes = await this.cacheManager.get(cacheKey);
    if (cachedBaremes) return cachedBaremes as BaremeOHADA[];

    // Simuler des barèmes OHADA - dans une vraie application, ceux-ci pourraient être stockés en base de données
    const baremes: BaremeOHADA[] = [
      {
        id: 'ohada-1',
        nom: 'Barème OHADA - Contentieux civil',
        description:
          'Barème applicable aux contentieux civils selon les dispositions OHADA',
        tranches: [
          { min: 0, max: 1000000, taux: 10, fixe: 50000 },
          { min: 1000001, max: 5000000, taux: 8, fixe: 130000 },
          { min: 5000001, max: 10000000, taux: 6, fixe: 290000 },
          { min: 10000001, max: 50000000, taux: 4, fixe: 590000 },
          { min: 50000001, max: Infinity, taux: 2, fixe: 1590000 },
        ],
      },
      {
        id: 'ohada-2',
        nom: 'Barème OHADA - Contentieux commercial',
        description:
          'Barème applicable aux contentieux commerciaux selon les dispositions OHADA',
        tranches: [
          { min: 0, max: 2000000, taux: 12, fixe: 60000 },
          { min: 2000001, max: 10000000, taux: 10, fixe: 180000 },
          { min: 10000001, max: 20000000, taux: 8, fixe: 380000 },
          { min: 20000001, max: 100000000, taux: 5, fixe: 780000 },
          { min: 100000001, max: Infinity, taux: 3, fixe: 1980000 },
        ],
      },
      {
        id: 'ohada-3',
        nom: 'Barème OHADA - Consultation juridique',
        description:
          'Barème applicable aux consultations juridiques selon les dispositions OHADA',
        tranches: [
          { min: 0, max: 500000, taux: 15, fixe: 30000 },
          { min: 500001, max: 2000000, taux: 12, fixe: 90000 },
          { min: 2000001, max: 5000000, taux: 10, fixe: 210000 },
          { min: 5000001, max: 20000000, taux: 7, fixe: 410000 },
          { min: 20000001, max: Infinity, taux: 4, fixe: 1010000 },
        ],
      },
    ];

    await this.cacheManager.set(cacheKey, baremes, 3600); // Cache pour 1 heure
    return baremes;
  }

  async calculerHonoraireSelonBareme(
    baremeId: string,
    montantBase: number,
  ): Promise<{ montantHT: number; details: any }> {
    const baremes = await this.getBaremesOHADA();
    const bareme = baremes.find((b) => b.id === baremeId);

    if (!bareme) {
      throw new NotFoundException(
        `Barème OHADA avec l'ID ${baremeId} non trouvé`,
      );
    }

    // Trouver la tranche applicable
    const trancheApplicable = bareme.tranches.find(
      (t) => montantBase >= t.min && montantBase <= t.max,
    );

    if (!trancheApplicable) {
      throw new BadRequestException(
        `Aucune tranche applicable pour le montant ${montantBase}`,
      );
    }

    // Calculer l'honoraire
    const montantVariable = (montantBase * trancheApplicable.taux) / 100;
    const montantHT = montantVariable + trancheApplicable.fixe;

    return {
      montantHT,
      details: {
        bareme: bareme.nom,
        tranche: trancheApplicable,
        montantBase,
        montantVariable,
        montantFixe: trancheApplicable.fixe,
      },
    };
  }

  async mettreAJourStatutHonoraire(
    id: string,
    statut: StatutHonoraire,
  ): Promise<HonoraireResponse> {
    const existingHonoraire = await this.prisma.honoraire.findUnique({
      where: { id },
    });
    if (!existingHonoraire)
      throw new NotFoundException(`Honoraire avec l'ID ${id} non trouvé`);

    const result = await this.prisma.honoraire.update({
      where: { id },
      data: { statut },
      include: {
        client: {
          select: { id: true, prenom: true, nom: true, entreprise: true },
        },
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            responsableId: true,
          },
        },
        paiements: true,
      },
    });

    await this.cacheManager.del(`honoraire:${id}`);
    await this.invalidateHonorairesCache();

    return this.formatHonoraireResponse(result);
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private formatHonoraireResponse(honoraire: any): HonoraireResponse {
    const montantRestant =
      honoraire.montantTTC -
      honoraire.paiements.reduce((sum: number, p: any) => sum + p.montant, 0);
    const enRetard = honoraire.dateEcheance
      ? new Date(honoraire.dateEcheance) < new Date() &&
        honoraire.statut !== StatutHonoraire.PAYE
      : false;

    return {
      ...honoraire,
      montantRestant,
      enRetard,
      tauxRecouvrement:
        honoraire.montantTTC > 0
          ? (honoraire.paiements.reduce(
              (sum: number, p: any) => sum + p.montant,
              0,
            ) /
              honoraire.montantTTC) *
            100
          : 0,
    };
  }

  private async invalidateHonorairesCache(): Promise<void> {
    try {
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores)
      ) {
        const store = this.cacheManager.stores[0];
        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('honoraires:*');
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
        "Erreur lors de l'invalidation du cache des honoraires:",
        error,
      );
    }
  }
}
