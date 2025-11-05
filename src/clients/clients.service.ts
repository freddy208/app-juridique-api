/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import {
  ClientResponse,
  ClientStatsResponse,
} from './interfaces/client-stats.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { StatutClient } from '@prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ClientService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private cloudinaryService: CloudinaryService,
  ) {}

  // -------------------- CRUD DE BASE --------------------
  async create(createClientDto: CreateClientDto): Promise<ClientResponse> {
    const { email, telephone } = createClientDto;

    // Vérifier si l'email ou le téléphone existe déjà
    if (email) {
      const existingEmail = await this.prisma.client.findFirst({
        where: { email },
      });
      if (existingEmail) {
        throw new BadRequestException(
          `Un client avec l'email ${email} existe déjà`,
        );
      }
    }

    if (telephone) {
      const existingPhone = await this.prisma.client.findFirst({
        where: { telephone },
      });
      if (existingPhone) {
        throw new BadRequestException(
          `Un client avec le téléphone ${telephone} existe déjà`,
        );
      }
    }

    // Générer un numéro de client si non fourni
    const numeroClient =
      createClientDto.numeroClient || (await this.generateNumeroClient());

    const client = await this.prisma.client.create({
      data: {
        ...createClientDto,
        numeroClient,
      },
    });

    await this.invalidateClientsCache();
    return this.formatClientResponse(client);
  }

  async findAll(query: QueryClientDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'creeLe',
      sortOrder = 'desc',
      search,
      typeClient,
      statut,
      ville,
      pays,
      estVIP,
    } = query;

    const cacheKey = `clients:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) return cachedResult;

    const where: any = {};

    // Filtrage par recherche (nom, prénom, entreprise)
    if (search) {
      where.OR = [
        { prenom: { contains: search, mode: 'insensitive' } },
        { nom: { contains: search, mode: 'insensitive' } },
        { entreprise: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtrage par type de client
    if (typeClient) {
      where.typeClient = typeClient;
    }

    // Filtrage par statut
    if (statut) {
      where.statut = statut;
    }

    // Filtrage par ville
    if (ville) {
      where.ville = { contains: ville, mode: 'insensitive' };
    }

    // Filtrage par pays
    if (pays) {
      where.pays = { contains: pays, mode: 'insensitive' };
    }

    // Filtrage par statut VIP
    if (estVIP !== undefined) {
      where.estVIP = estVIP;
    }

    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        ...paginationParams,
      }),
      this.prisma.client.count({ where }),
    ]);

    // Enrichir les données avec des informations supplémentaires
    const enrichedClients = await Promise.all(
      clients.map(async (client) => {
        const nombreDossiers = await this.prisma.dossier.count({
          where: { clientId: client.id },
        });

        return this.formatClientResponse({
          ...client,
          nombreDossiers,
        });
      }),
    );

    const result = PaginationUtil.createPaginationResult(
      enrichedClients,
      total,
      { page, limit, sortBy, sortOrder },
    );

    await this.cacheManager.set(cacheKey, result, 300);
    return result;
  }

  async findOne(id: string): Promise<ClientResponse> {
    const cacheKey = `client:${id}`;
    const cachedClient = await this.cacheManager.get(cacheKey);
    if (cachedClient) return cachedClient as ClientResponse;

    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException(`Client avec l'ID ${id} non trouvé`);
    }

    // Compter le nombre de dossiers associés
    const nombreDossiers = await this.prisma.dossier.count({
      where: { clientId: client.id },
    });

    const formattedClient = this.formatClientResponse({
      ...client,
      nombreDossiers,
    });

    await this.cacheManager.set(cacheKey, formattedClient, 600);
    return formattedClient;
  }

  async update(
    id: string,
    updateClientDto: UpdateClientDto,
  ): Promise<ClientResponse> {
    const existingClient = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new NotFoundException(`Client avec l'ID ${id} non trouvé`);
    }

    // Vérifier si l'email ou le téléphone existe déjà (si modifié)
    const { email, telephone } = updateClientDto;

    if (email && email !== existingClient.email) {
      const existingEmail = await this.prisma.client.findFirst({
        where: { email, id: { not: id } },
      });
      if (existingEmail) {
        throw new BadRequestException(
          `Un client avec l'email ${email} existe déjà`,
        );
      }
    }

    if (telephone && telephone !== existingClient.telephone) {
      const existingPhone = await this.prisma.client.findFirst({
        where: { telephone, id: { not: id } },
      });
      if (existingPhone) {
        throw new BadRequestException(
          `Un client avec le téléphone ${telephone} existe déjà`,
        );
      }
    }

    const updatedClient = await this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });

    await this.cacheManager.del(`client:${id}`);
    await this.invalidateClientsCache();
    return this.formatClientResponse(updatedClient);
  }

  async remove(id: string): Promise<void> {
    const existingClient = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new NotFoundException(`Client avec l'ID ${id} non trouvé`);
    }

    // Vérifier si le client a des dossiers associés
    const dossiersCount = await this.prisma.dossier.count({
      where: { clientId: id },
    });

    if (dossiersCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer ce client car il a ${dossiersCount} dossier(s) associé(s)`,
      );
    }

    await this.prisma.client.delete({ where: { id } });

    await this.cacheManager.del(`client:${id}`);
    await this.invalidateClientsCache();
  }

  // -------------------- MÉTHODES SPÉCIFIQUES --------------------

  async getStats(): Promise<ClientStatsResponse> {
    const cacheKey = 'clients-stats';
    const cachedStats = await this.cacheManager.get(cacheKey);
    if (cachedStats) return cachedStats as ClientStatsResponse;

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalClients,
      clientsActifs,
      clientsInactifs,
      clientsArchives,
      clientsVIP,
      clientsParType,
      clientsParVille,
      topClientsParChiffreAffaires,
      nouveauxClientsParMois,
    ] = await Promise.all([
      this.prisma.client.count(),
      this.prisma.client.count({ where: { statut: StatutClient.ACTIF } }),
      this.prisma.client.count({ where: { statut: StatutClient.INACTIF } }),
      this.prisma.client.count({ where: { statut: StatutClient.ARCHIVE } }),
      this.prisma.client.count({ where: { estVIP: true } }),
      this.prisma.client.groupBy({
        by: ['typeClient'],
        _count: true,
      }),
      this.prisma.$queryRaw`
        SELECT ville, COUNT(*) as count
        FROM "Client"
        WHERE ville IS NOT NULL
        GROUP BY ville
        ORDER BY count DESC
        LIMIT 10
      ` as unknown as Array<{ ville: string; count: bigint }>,
      this.prisma.$queryRaw`
        SELECT 
          c.id, c.prenom, c.nom, c.entreprise, COALESCE(c."chiffreAffaires", 0) as "chiffreAffaires",
          COUNT(d.id) as "nombreDossiers"
        FROM "Client" c
        LEFT JOIN "Dossier" d ON c.id = d."clientId"
        WHERE c."chiffreAffaires" > 0
        GROUP BY c.id, c.prenom, c.nom, c.entreprise, c."chiffreAffaires"
        ORDER BY c."chiffreAffaires" DESC
        LIMIT 10
      ` as unknown as Array<{
        id: string;
        prenom: string;
        nom: string;
        entreprise?: string;
        chiffreAffaires: bigint;
        nombreDossiers: bigint;
      }>,
      this.prisma.$queryRaw`
        SELECT 
          TO_CHAR("creeLe", 'YYYY-MM') as mois,
          COUNT(*) as count
        FROM "Client"
        WHERE "creeLe" >= ${startOfYear}
        GROUP BY TO_CHAR("creeLe", 'YYYY-MM')
        ORDER BY mois DESC
      ` as unknown as Array<{ mois: string; count: bigint }>,
    ]);

    // Calculer les pourcentages pour les types de clients
    const totalClientsForPercentage = totalClients || 1; // Éviter division par zéro
    const clientsParTypeWithPercentage = clientsParType.map((item) => ({
      type: item.typeClient,
      count: item._count,
      percentage: Math.round((item._count / totalClientsForPercentage) * 100),
    }));

    // Formater les résultats
    const stats: ClientStatsResponse = {
      totalClients,
      clientsActifs,
      clientsInactifs,
      clientsArchives,
      clientsVIP,
      clientsParType: clientsParTypeWithPercentage,
      clientsParVille: clientsParVille.map((item) => ({
        ville: item.ville,
        count: Number(item.count),
      })),
      topClientsParChiffreAffaires: topClientsParChiffreAffaires.map(
        (item) => ({
          id: item.id,
          nomComplet: `${item.prenom} ${item.nom}`,
          entreprise: item.entreprise,
          chiffreAffaires: Number(item.chiffreAffaires),
          nombreDossiers: Number(item.nombreDossiers),
        }),
      ),
      nouveauxClientsParMois: nouveauxClientsParMois.map((item) => ({
        mois: item.mois,
        count: Number(item.count),
      })),
    };

    await this.cacheManager.set(cacheKey, stats, 600);
    return stats;
  }

  async uploadDocumentIdentite(
    clientId: string,
    file: Express.Multer.File,
    type: string,
    titre: string,
    numero?: string,
    dateDelivrance?: Date,
    dateExpiration?: Date,
    lieuDelivrance?: string,
  ) {
    // Vérifier si le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client avec l'ID ${clientId} non trouvé`);
    }

    // Uploader le fichier sur Cloudinary
    const uploadResult = await this.cloudinaryService.uploadFile(file);

    // Enregistrer les métadonnées du document dans la base de données
    const document = await this.prisma.documentIdentite.create({
      data: {
        clientId,
        type: type as any, // TypeDocumentIdentite
        titre,
        numero,
        dateDelivrance,
        dateExpiration,
        lieuDelivrance,
        url: uploadResult.secure_url,
        nomFichier: file.originalname,
        tailleFichier: file.size,
        publicId: uploadResult.public_id,
      },
    });

    // Invalider le cache du client
    await this.cacheManager.del(`client:${clientId}`);

    return document;
  }

  async getDocumentsIdentite(clientId: string) {
    // Vérifier si le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client avec l'ID ${clientId} non trouvé`);
    }

    return this.prisma.documentIdentite.findMany({
      where: { clientId },
      orderBy: { creeLe: 'desc' },
    });
  }

  async deleteDocumentIdentite(clientId: string, documentId: string) {
    // Vérifier si le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client avec l'ID ${clientId} non trouvé`);
    }

    // Vérifier si le document existe et appartient au client
    const document = await this.prisma.documentIdentite.findFirst({
      where: { id: documentId, clientId },
    });

    if (!document) {
      throw new NotFoundException(
        `Document avec l'ID ${documentId} non trouvé pour ce client`,
      );
    }

    // Supprimer le document de Cloudinary
    try {
      await this.cloudinaryService.deleteFile(document.publicId);
    } catch (error) {
      console.error(
        'Erreur lors de la suppression du fichier sur Cloudinary:',
        error,
      );
      // Continuer même si la suppression sur Cloudinary échoue
    }

    // Supprimer le document de la base de données
    await this.prisma.documentIdentite.delete({
      where: { id: documentId },
    });

    // Invalider le cache du client
    await this.cacheManager.del(`client:${clientId}`);

    return { message: 'Document supprimé avec succès' };
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private formatClientResponse(client: any): ClientResponse {
    return {
      ...client,
      chiffreAffaires: Number(client.chiffreAffaires || 0),
      nombreDossiers: client.nombreDossiers || 0,
      derniereVisiteFormatee: client.derniereVisite
        ? client.derniereVisite.toLocaleDateString('fr-FR')
        : undefined,
      dateCreationFormatee: client.creeLe.toLocaleDateString('fr-FR'),
      nomComplet: `${client.prenom} ${client.nom}`,
    };
  }

  private async generateNumeroClient(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const prefix = `CL${year}${month}${day}`;

    const counter = await this.prisma.counter.upsert({
      where: { key: prefix },
      update: { value: { increment: 1 } },
      create: { key: prefix, value: 1 },
    });

    return `${prefix}${String(counter.value).padStart(3, '0')}`;
  }

  private async invalidateClientsCache(): Promise<void> {
    try {
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores)
      ) {
        const store = this.cacheManager.stores[0];
        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('clients:*');
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
        "Erreur lors de l'invalidation du cache des clients:",
        error,
      );
    }
  }
}
