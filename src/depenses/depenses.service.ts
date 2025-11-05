/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/depenses/depenses.service.ts
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateDepenseDto } from './dto/create-depense.dto';
import { UpdateDepenseDto } from './dto/update-depense.dto';
import { StatutDepense } from '@prisma/client';
import { PaginationUtil } from '../common/utils/pagination.util';
import { NotificationsService } from '../notifications/notifications.service';
import { DepenseResponse } from './interfaces/depense-response.interface';
import { QueryDepenseDto } from './dto/query-depense.dto';

@Injectable()
export class DepensesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  // -------------------- CRUD DE BASE --------------------
  async create(createDepenseDto: CreateDepenseDto): Promise<DepenseResponse> {
    const { dossierId } = createDepenseDto;

    // Vérifier l'existence du dossier si spécifié
    if (dossierId) {
      await this.prisma.dossier.findUniqueOrThrow({ where: { id: dossierId } });
    }

    const result = await this.prisma.depense.create({
      data: {
        ...createDepenseDto,
        dateDepense: new Date(createDepenseDto.dateDepense),
        montant: createDepenseDto.montant,
      },
      include: {
        dossier: {
          select: { id: true, numeroUnique: true, titre: true },
        },
      },
    });

    await this.invalidateDepensesCache();
    return result as DepenseResponse;
  }

  async findAll(query: QueryDepenseDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'dateDepense',
      sortOrder = 'desc',
      categorie,
      statut,
      dossierId,
      dateMin,
      dateMax,
    } = query;

    const cacheKey = `depenses:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) return cachedResult;

    const where: any = {};
    if (categorie) where.categorie = categorie;
    if (statut) where.statut = statut;
    if (dossierId) where.dossierId = dossierId;
    if (dateMin || dateMax) {
      where.dateDepense = {};
      if (dateMin) where.dateDepense.gte = new Date(dateMin);
      if (dateMax) where.dateDepense.lte = new Date(dateMax);
    }

    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const [depenses, total] = await Promise.all([
      this.prisma.depense.findMany({
        where,
        ...paginationParams,
        include: {
          dossier: {
            select: { id: true, numeroUnique: true, titre: true },
          },
        },
      }),
      this.prisma.depense.count({ where }),
    ]);

    const result = PaginationUtil.createPaginationResult(depenses, total, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    await this.cacheManager.set(cacheKey, result, 300);
    return result;
  }

  async findOne(id: string): Promise<DepenseResponse> {
    const cacheKey = `depense:${id}`;
    const cachedDepense = await this.cacheManager.get(cacheKey);
    if (cachedDepense) return cachedDepense as DepenseResponse;

    const depense = await this.prisma.depense.findUnique({
      where: { id },
      include: {
        dossier: {
          select: { id: true, numeroUnique: true, titre: true },
        },
      },
    });

    if (!depense)
      throw new NotFoundException(`Dépense avec l'ID ${id} non trouvée`);

    await this.cacheManager.set(cacheKey, depense, 600);
    return depense as DepenseResponse;
  }

  async update(
    id: string,
    updateDepenseDto: UpdateDepenseDto,
  ): Promise<DepenseResponse> {
    const existingDepense = await this.prisma.depense.findUnique({
      where: { id },
    });
    if (!existingDepense)
      throw new NotFoundException(`Dépense avec l'ID ${id} non trouvée`);

    const { dossierId, dateDepense, ...restOfData } = updateDepenseDto;

    // Vérifier l'existence du dossier si spécifié
    if (dossierId) {
      await this.prisma.dossier.findUniqueOrThrow({ where: { id: dossierId } });
    }

    const depenseData: any = { ...restOfData };
    if (dateDepense) depenseData.dateDepense = new Date(dateDepense);

    const result = await this.prisma.depense.update({
      where: { id },
      data: depenseData,
      include: {
        dossier: {
          select: { id: true, numeroUnique: true, titre: true },
        },
      },
    });

    await this.cacheManager.del(`depense:${id}`);
    await this.invalidateDepensesCache();
    return result as DepenseResponse;
  }

  async remove(id: string): Promise<void> {
    const existingDepense = await this.prisma.depense.findUnique({
      where: { id },
    });
    if (!existingDepense)
      throw new NotFoundException(`Dépense avec l'ID ${id} non trouvée`);

    await this.prisma.depense.delete({ where: { id } });

    await this.cacheManager.del(`depense:${id}`);
    await this.invalidateDepensesCache();
  }

  // -------------------- MÉTHODES SPÉCIFIQUES --------------------

  async validerDepense(
    id: string,
    valideParId: string,
  ): Promise<DepenseResponse> {
    const depense = await this.prisma.depense.update({
      where: { id },
      data: {
        statut: StatutDepense.APPROUVE,
        validePar: valideParId,
      },
      include: {
        dossier: {
          select: { id: true, numeroUnique: true, titre: true },
        },
      },
    });

    await this.cacheManager.del(`depense:${id}`);
    await this.invalidateDepensesCache();
    return depense as DepenseResponse;
  }

  async rejeterDepense(
    id: string,
    valideParId: string,
  ): Promise<DepenseResponse> {
    const depense = await this.prisma.depense.update({
      where: { id },
      data: {
        statut: StatutDepense.REJETE,
        validePar: valideParId,
      },
      include: {
        dossier: {
          select: { id: true, numeroUnique: true, titre: true },
        },
      },
    });

    await this.cacheManager.del(`depense:${id}`);
    await this.invalidateDepensesCache();
    return depense as DepenseResponse;
  }

  async getDepensesEnAttente(query: QueryDepenseDto) {
    return this.findAll({
      ...query,
      statut: StatutDepense.EN_ATTENTE,
    });
  }

  async getDepensesByDossier(dossierId: string, query: QueryDepenseDto) {
    return this.findAll({
      ...query,
      dossierId,
    });
  }

  async getStats(): Promise<any> {
    const cacheKey = 'depenses-stats';
    const cachedStats = await this.cacheManager.get(cacheKey);
    if (cachedStats) return cachedStats;

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalDepenses,
      depensesParCategorie,
      depensesParMois,
      depensesEnAttente,
      depensesApprouvees,
      depensesRejetees,
    ] = await Promise.all([
      this.prisma.depense.aggregate({
        _sum: { montant: true },
        where: { statut: StatutDepense.APPROUVE },
      }),
      this.prisma.depense.groupBy({
        by: ['categorie'],
        _sum: { montant: true },
        _count: true,
        where: { statut: StatutDepense.APPROUVE },
      }),
      this.prisma.$queryRaw`
        SELECT 
          TO_CHAR("dateDepense", 'YYYY-MM') as mois,
          SUM("montant") as montant
        FROM "Depense" 
        WHERE statut = 'APPROUVE' AND "dateDepense" >= ${startOfYear}
        GROUP BY TO_CHAR("dateDepense", 'YYYY-MM')
        ORDER BY mois DESC
      ` as unknown as { mois: string; montant: bigint }[],
      this.prisma.depense.aggregate({
        _sum: { montant: true },
        _count: true,
        where: { statut: StatutDepense.EN_ATTENTE },
      }),
      this.prisma.depense.aggregate({
        _sum: { montant: true },
        _count: true,
        where: { statut: StatutDepense.APPROUVE },
      }),
      this.prisma.depense.aggregate({
        _sum: { montant: true },
        _count: true,
        where: { statut: StatutDepense.REJETE },
      }),
    ]);

    const totalDepensesMontant = Number(totalDepenses._sum.montant || 0);
    const totalEnAttente = Number(depensesEnAttente._sum.montant || 0);
    const totalApprouvees = Number(depensesApprouvees._sum.montant || 0);
    const totalRejetees = Number(depensesRejetees._sum.montant || 0);

    const stats = {
      totalDepenses: totalDepensesMontant,
      totalEnAttente,
      totalApprouvees,
      totalRejetees,
      depensesParCategorie: depensesParCategorie.map((item) => ({
        categorie: item.categorie,
        count: item._count,
        montantTotal: Number(item._sum.montant),
      })),
      depensesParMois: depensesParMois.map((d) => ({
        mois: d.mois,
        montant: Number(d.montant),
      })),
      depensesEnAttenteDetails: {
        count: depensesEnAttente._count,
        montantTotal: totalEnAttente,
      },
    };

    await this.cacheManager.set(cacheKey, stats, 600);
    return stats;
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private async invalidateDepensesCache(): Promise<void> {
    try {
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores)
      ) {
        const store = this.cacheManager.stores[0];
        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('depenses:*');
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
        "Erreur lors de l'invalidation du cache des dépenses:",
        error,
      );
    }
  }
}
