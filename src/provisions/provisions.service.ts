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
import { CreateProvisionDto } from './dto/create-provision.dto';
import { UpdateProvisionDto } from './dto/update-provision.dto';
import { StatutProvision, TypeMouvement } from '@prisma/client';
import { PaginationUtil } from '../common/utils/pagination.util';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ProvisionResponse,
  ProvisionStatsResponse,
} from './interfaces/provision-response.interface';
import { QueryProvisionDto } from './dto/query-provision.dto';

@Injectable()
export class ProvisionsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  // -------------------- CRUD DE BASE --------------------
  async create(
    createProvisionDto: CreateProvisionDto,
  ): Promise<ProvisionResponse> {
    const { dossierId, clientId, montant } = createProvisionDto;

    // Vérifier l'existence du client et du dossier
    await this.prisma.client.findUniqueOrThrow({ where: { id: clientId } });
    await this.prisma.dossier.findUniqueOrThrow({ where: { id: dossierId } });

    const result = await this.prisma.$transaction(async (tx) => {
      const newProvision = await tx.provision.create({
        data: {
          dossierId,
          clientId,
          montant,
          solde: montant,
          statut: StatutProvision.ACTIVE,
        },
      });

      // Créer le mouvement initial (crédit)
      await tx.mouvementProvision.create({
        data: {
          provisionId: newProvision.id,
          type: TypeMouvement.CREDIT,
          montant,
          description: 'Provision initiale',
          soldeApres: montant,
        },
      });

      return newProvision;
    });

    await this.invalidateProvisionsCache();
    return this.findOne(result.id); // Récupérer la provision complète avec les relations
  }

  async findAll(query: QueryProvisionDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'dateProvision',
      sortOrder = 'desc',
      clientId,
      dossierId,
      statut,
      dateMin,
      dateMax,
    } = query;

    const cacheKey = `provisions:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) return cachedResult;

    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (dossierId) where.dossierId = dossierId;
    if (statut) where.statut = statut;
    if (dateMin || dateMax) {
      where.dateProvision = {};
      if (dateMin) where.dateProvision.gte = new Date(dateMin);
      if (dateMax) where.dateProvision.lte = new Date(dateMax);
    }

    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const [provisions, total] = await Promise.all([
      this.prisma.provision.findMany({
        where,
        ...paginationParams,
        include: {
          client: {
            select: { id: true, prenom: true, nom: true, entreprise: true },
          },
          dossier: { select: { id: true, numeroUnique: true, titre: true } },
          mouvements: {
            orderBy: { creeLe: 'desc' },
          },
        },
      }),
      this.prisma.provision.count({ where }),
    ]);

    const formattedProvisions = provisions.map((p) =>
      this.formatProvisionResponse(p),
    );
    const result = PaginationUtil.createPaginationResult(
      formattedProvisions,
      total,
      { page, limit, sortBy, sortOrder },
    );

    await this.cacheManager.set(cacheKey, result, 300);
    return result;
  }

  async findOne(id: string): Promise<ProvisionResponse> {
    const cacheKey = `provision:${id}`;
    const cachedProvision = await this.cacheManager.get(cacheKey);
    if (cachedProvision) return cachedProvision as ProvisionResponse;

    const provision = await this.prisma.provision.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, prenom: true, nom: true, entreprise: true },
        },
        dossier: { select: { id: true, numeroUnique: true, titre: true } },
        mouvements: {
          orderBy: { creeLe: 'desc' },
        },
      },
    });

    if (!provision)
      throw new NotFoundException(`Provision avec l'ID ${id} non trouvée`);

    await this.cacheManager.set(cacheKey, provision, 600);
    return this.formatProvisionResponse(provision);
  }

  async update(
    id: string,
    updateProvisionDto: UpdateProvisionDto,
  ): Promise<ProvisionResponse> {
    const existingProvision = await this.prisma.provision.findUnique({
      where: { id },
      include: { mouvements: true },
    });
    if (!existingProvision)
      throw new NotFoundException(`Provision avec l'ID ${id} non trouvée`);

    const result = await this.prisma.$transaction(async (tx) => {
      return await tx.provision.update({
        where: { id },
        data: updateProvisionDto,
        include: {
          client: {
            select: { id: true, prenom: true, nom: true, entreprise: true },
          },
          dossier: { select: { id: true, numeroUnique: true, titre: true } },
          mouvements: {
            orderBy: { creeLe: 'desc' },
          },
        },
      });
    });

    await this.cacheManager.del(`provision:${id}`);
    await this.invalidateProvisionsCache();
    return this.formatProvisionResponse(result);
  }

  async remove(id: string): Promise<void> {
    const existingProvision = await this.prisma.provision.findUnique({
      where: { id },
    });
    if (!existingProvision)
      throw new NotFoundException(`Provision avec l'ID ${id} non trouvée`);

    // Le `onDelete: Cascade` dans le schéma s'occupera de supprimer les mouvements associés.
    await this.prisma.provision.delete({ where: { id } });

    await this.cacheManager.del(`provision:${id}`);
    await this.invalidateProvisionsCache();
  }

  // -------------------- MÉTHODES SPÉCIFIQUES --------------------

  async ajouterMouvement(
    provisionId: string,
    type: TypeMouvement,
    montant: number,
    description: string,
  ): Promise<ProvisionResponse> {
    const provision = await this.prisma.provision.findUnique({
      where: { id: provisionId },
      include: { mouvements: true },
    });

    if (!provision)
      throw new NotFoundException(
        `Provision avec l'ID ${provisionId} non trouvée`,
      );

    const result = await this.prisma.$transaction(async (tx) => {
      // Calculer le nouveau solde
      let nouveauSolde = Number(provision.solde);
      if (type === TypeMouvement.DEBIT) {
        nouveauSolde -= montant;
      } else {
        nouveauSolde += montant;
      }

      // Créer le mouvement
      await tx.mouvementProvision.create({
        data: {
          provisionId,
          type,
          montant,
          description,
          soldeApres: nouveauSolde,
        },
      });

      // Mettre à jour le solde de la provision
      return await tx.provision.update({
        where: { id: provisionId },
        data: {
          solde: nouveauSolde,
          statut:
            nouveauSolde <= 0
              ? StatutProvision.EPUISEE
              : StatutProvision.ACTIVE,
        },
        include: {
          client: {
            select: { id: true, prenom: true, nom: true, entreprise: true },
          },
          dossier: { select: { id: true, numeroUnique: true, titre: true } },
          mouvements: {
            orderBy: { creeLe: 'desc' },
          },
        },
      });
    });

    await this.cacheManager.del(`provision:${provisionId}`);
    await this.invalidateProvisionsCache();
    return this.formatProvisionResponse(result);
  }

  async restituerProvision(id: string): Promise<ProvisionResponse> {
    const provision = await this.prisma.provision.findUnique({
      where: { id },
    });

    if (!provision)
      throw new NotFoundException(`Provision avec l'ID ${id} non trouvée`);

    const result = await this.prisma.provision.update({
      where: { id },
      data: { statut: StatutProvision.RESTITUEE },
      include: {
        client: {
          select: { id: true, prenom: true, nom: true, entreprise: true },
        },
        dossier: { select: { id: true, numeroUnique: true, titre: true } },
        mouvements: {
          orderBy: { creeLe: 'desc' },
        },
      },
    });

    await this.cacheManager.del(`provision:${id}`);
    await this.invalidateProvisionsCache();
    return this.formatProvisionResponse(result);
  }

  async getProvisionsEpuisees(query: QueryProvisionDto) {
    return this.findAll({
      ...query,
      statut: StatutProvision.EPUISEE,
    });
  }

  async getStats(): Promise<ProvisionStatsResponse> {
    const cacheKey = 'provisions-stats';
    const cachedStats = await this.cacheManager.get(cacheKey);
    if (cachedStats) return cachedStats as ProvisionStatsResponse;

    const [
      totalProvisions,
      totalMouvementsDebit,
      totalMouvementsCredit,
      nombreProvisionsParStatut,
      provisionsParMois,
      topClientsProvisions,
      provisionsEpuiseesDetails,
    ] = await Promise.all([
      this.prisma.provision.aggregate({
        _sum: { montant: true },
        _count: true,
      }),
      this.prisma.mouvementProvision.aggregate({
        _sum: { montant: true },
        where: { type: TypeMouvement.DEBIT },
      }),
      this.prisma.mouvementProvision.aggregate({
        _sum: { montant: true },
        where: { type: TypeMouvement.CREDIT },
      }),
      this.prisma.provision.groupBy({
        by: ['statut'],
        _count: true,
        _sum: { montant: true },
      }),
      this.prisma.$queryRaw`
        SELECT 
          TO_CHAR("dateProvision", 'YYYY-MM') as mois,
          SUM("montant") as montant
        FROM "Provision" 
        GROUP BY TO_CHAR("dateProvision", 'YYYY-MM')
        ORDER BY mois DESC
      ` as unknown as { mois: string; montant: bigint }[],
      this.prisma.$queryRaw`
        SELECT 
          c.id, c.prenom, c.nom, c.entreprise,
          COALESCE(SUM(p."montant"), 0) as "totalProvision"
        FROM "Provision" p
        JOIN "Client" c ON p."clientId" = c.id
        GROUP BY c.id, c.prenom, c.nom, c.entreprise
        ORDER BY "totalProvision" DESC
        LIMIT 10
      ` as unknown as {
        id: string;
        prenom: string;
        nom: string;
        entreprise: string | null;
        totalProvision: bigint;
      }[],
      this.prisma.provision.aggregate({
        _sum: { montant: true },
        _count: true,
        where: { statut: StatutProvision.EPUISEE },
      }),
    ]);

    const totalProvisionsMontant = Number(totalProvisions._sum.montant || 0);
    const totalDebitMontant = Number(totalMouvementsDebit._sum.montant || 0);
    const totalCreditMontant = Number(totalMouvementsCredit._sum.montant || 0);
    const soldeTotal = totalCreditMontant - totalDebitMontant;
    const totalEpuisees = Number(provisionsEpuiseesDetails._sum.montant || 0);

    const stats: ProvisionStatsResponse = {
      totalProvisions: totalProvisionsMontant,
      totalDebit: totalDebitMontant,
      totalCredit: totalCreditMontant,
      soldeTotal,
      totalEpuisees,
      nombreProvisionsParStatut: nombreProvisionsParStatut.map((item) => ({
        statut: item.statut,
        count: item._count,
        montantTotal: Number(item._sum.montant),
      })),
      provisionsParMois: provisionsParMois.map((p) => ({
        mois: p.mois,
        montant: Number(p.montant),
      })),
      topClientsProvisions: topClientsProvisions.map((c) => ({
        ...c,
        totalProvision: Number(c.totalProvision),
      })),
      provisionsEpuiseesDetails: {
        count: provisionsEpuiseesDetails._count,
        montantTotal: totalEpuisees,
      },
    };

    await this.cacheManager.set(cacheKey, stats, 600);
    return stats;
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private formatProvisionResponse(provision: any): ProvisionResponse {
    const tauxUtilisation =
      provision.montant > 0
        ? ((provision.montant - Number(provision.solde)) /
            Number(provision.montant)) *
          100
        : 0;

    return {
      ...provision,
      tauxUtilisation,
    };
  }

  private async invalidateProvisionsCache(): Promise<void> {
    try {
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores)
      ) {
        const store = this.cacheManager.stores[0];
        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('provisions:*');
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
        "Erreur lors de l'invalidation du cache des provisions:",
        error,
      );
    }
  }
}
