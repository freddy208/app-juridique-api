/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// clients.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ChangeClientStatusDto } from './dto/change-client-status.dto';
import { FilterClientsDto } from './dto/filter-clients.dto';
import {
  BulkActionClientsDto,
  BulkActionType,
} from './dto/bulk-action-clients.dto';
import { AddIdentityDocumentDto } from './dto/add-identity-document.dto';
import { AddClientNoteDto } from './dto/add-client-note.dto';
import {
  IClient,
  IClientWithRelations,
  IClientStats,
  IClientPerformance,
  IClientActivity,
  IPaginatedClients,
  IClientFinancialSummary,
  IBulkActionResult,
} from './interfaces/client.interface';
import {
  StatutClient,
  StatutDossier,
  StatutFacture,
  Prisma,
} from '@prisma/client';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un nouveau client
   */
  async create(createClientDto: CreateClientDto): Promise<IClient> {
    try {
      // Vérifier si un client avec le même email existe déjà
      if (createClientDto.email) {
        const existingClient = await this.prisma.client.findFirst({
          where: { email: createClientDto.email },
        });

        if (existingClient) {
          throw new ConflictException('Un client avec cet email existe déjà');
        }
      }

      // Vérifier si un client avec le même téléphone existe déjà
      if (createClientDto.telephone) {
        const existingClient = await this.prisma.client.findFirst({
          where: { telephone: createClientDto.telephone },
        });

        if (existingClient) {
          throw new ConflictException(
            'Un client avec ce numéro de téléphone existe déjà',
          );
        }
      }

      const client = await this.prisma.client.create({
        data: {
          ...createClientDto,
          statut: StatutClient.ACTIF,
          derniereVisite: new Date(),
        },
      });

      this.logger.log(`Client créé avec succès: ${client.id}`);
      // Convertir Decimal en number pour l'interface
      return {
        ...client,
        chiffreAffaires: client.chiffreAffaires
          ? Number(client.chiffreAffaires)
          : null,
      };
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Erreur lors de la création du client: ${error.message}`,
      );
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la création du client',
      );
    }
  }

  /**
   * Obtenir la liste des clients avec pagination et filtres
   */
  async findAll(params: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: FilterClientsDto;
  }): Promise<IPaginatedClients> {
    try {
      const {
        page,
        limit,
        sortBy = 'creeLe',
        sortOrder = 'desc',
        filters,
      } = params;
      const skip = (page - 1) * limit;

      // Construction des filtres
      const where: Prisma.ClientWhereInput = {};

      if (filters) {
        // Si un statut est spécifié, l'utiliser
        if (filters.statut) {
          where.statut = filters.statut;
        }

        if (filters.search) {
          where.OR = [
            { prenom: { contains: filters.search, mode: 'insensitive' } },
            { nom: { contains: filters.search, mode: 'insensitive' } },
            {
              nomEntreprise: { contains: filters.search, mode: 'insensitive' },
            },
            { email: { contains: filters.search, mode: 'insensitive' } },
            { telephone: { contains: filters.search, mode: 'insensitive' } },
          ];
        }

        if (filters.vipOnly) {
          where.statutVIP = true;
        }

        if (filters.hasActiveDossiers) {
          where.dossiers = {
            some: {
              statut: {
                in: [StatutDossier.OUVERT, StatutDossier.EN_COURS],
              },
            },
          };
        }

        if (filters.hasUnpaidInvoices) {
          where.factures = {
            some: {
              statut: {
                in: [StatutFacture.IMPAYEE, StatutFacture.PARTIELLE],
              },
            },
          };
        }

        if (filters.dateCreationDebut || filters.dateCreationFin) {
          where.creeLe = {};
          if (filters.dateCreationDebut) {
            where.creeLe.gte = new Date(filters.dateCreationDebut);
          }
          if (filters.dateCreationFin) {
            where.creeLe.lte = new Date(filters.dateCreationFin);
          }
        }

        if (
          filters.chiffreAffairesMin !== undefined ||
          filters.chiffreAffairesMax !== undefined
        ) {
          where.chiffreAffaires = {};
          if (filters.chiffreAffairesMin !== undefined) {
            where.chiffreAffaires.gte = filters.chiffreAffairesMin;
          }
          if (filters.chiffreAffairesMax !== undefined) {
            where.chiffreAffaires.lte = filters.chiffreAffairesMax;
          }
        }
      }

      // Exécution des requêtes en parallèle
      const [clients, total] = await Promise.all([
        this.prisma.client.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            dossiers: {
              select: {
                id: true,
                numeroUnique: true,
                titre: true,
                statut: true,
              },
              take: 5,
              orderBy: { creeLe: 'desc' },
            },
            factures: {
              select: {
                id: true,
                numeroFacture: true,
                montantTTC: true,
                statut: true,
              },
              take: 5,
              orderBy: { creeLe: 'desc' },
            },
            _count: {
              select: {
                dossiers: true,
                factures: true,
                notes: true,
              },
            },
          },
        }),
        this.prisma.client.count({ where }),
      ]);
      const clientsWithNumber = clients.map((client) => ({
        ...client,
        chiffreAffaires: client.chiffreAffaires
          ? Number(client.chiffreAffaires)
          : null,
      }));

      return {
        data: clientsWithNumber,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Erreur lors de la récupération des clients: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la récupération des clients',
      );
    }
  }

  /**
   * Obtenir un client par son ID avec toutes ses relations
   */
  async findOne(id: string): Promise<IClientWithRelations> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id },
        include: {
          dossiers: {
            include: {
              responsable: {
                select: {
                  id: true,
                  prenom: true,
                  nom: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  documents: true,
                  taches: true,
                },
              },
            },
            orderBy: { creeLe: 'desc' },
          },
          factures: {
            orderBy: { creeLe: 'desc' },
          },
          notes: {
            include: {
              utilisateur: {
                select: {
                  id: true,
                  prenom: true,
                  nom: true,
                },
              },
            },
            orderBy: { creeLe: 'desc' },
          },
          documentIdentite: {
            orderBy: { creeLe: 'desc' },
          },
          honoraires: {
            orderBy: { creeLe: 'desc' },
          },
          paiements: {
            orderBy: { datePayement: 'desc' },
          },
          provisions: {
            orderBy: { creeLe: 'desc' },
          },
          communicationClient: {
            orderBy: { creeLe: 'desc' },
            take: 10,
          },
          satisfaction: {
            orderBy: { dateEvaluation: 'desc' },
          },
        },
      });

      if (!client) {
        throw new NotFoundException(`Client avec l'ID ${id} non trouvé`);
      }

      // sourcery skip: inline-immediately-returned-variable
      const clientWithNumberClient = {
        ...client,
        chiffreAffaires: client.chiffreAffaires
          ? Number(client.chiffreAffaires)
          : null,
      };

      return clientWithNumberClient;
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Erreur lors de la récupération du client: ${error.message}`,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la récupération du client',
      );
    }
  }

  /**
   * Mettre à jour un client
   */
  async update(id: string, updateClientDto: UpdateClientDto): Promise<IClient> {
    try {
      await this.findOne(id);

      // Vérifier l'unicité de l'email si modifié
      if (updateClientDto.email) {
        const existingClient = await this.prisma.client.findFirst({
          where: {
            email: updateClientDto.email,
            NOT: { id },
          },
        });

        if (existingClient) {
          throw new ConflictException(
            'Un autre client avec cet email existe déjà',
          );
        }
      }

      // Vérifier l'unicité du téléphone si modifié
      if (updateClientDto.telephone) {
        const existingClient = await this.prisma.client.findFirst({
          where: {
            telephone: updateClientDto.telephone,
            NOT: { id },
          },
        });

        if (existingClient) {
          throw new ConflictException(
            'Un autre client avec ce numéro de téléphone existe déjà',
          );
        }
      }

      const client = await this.prisma.client.update({
        where: { id },
        data: updateClientDto,
      });

      this.logger.log(`Client mis à jour: ${id}`);

      // Convertir Decimal en number pour l'interface
      return {
        ...client,
        chiffreAffaires: client.chiffreAffaires
          ? Number(client.chiffreAffaires)
          : null,
      };
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Erreur lors de la mise à jour du client: ${error.message}`,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la mise à jour du client',
      );
    }
  }

  /**
   * Changer le statut d'un client
   */
  async changeStatus(
    id: string,
    changeStatusDto: ChangeClientStatusDto,
  ): Promise<IClient> {
    try {
      await this.findOne(id);

      const client = await this.prisma.client.update({
        where: { id },
        data: {
          statut: changeStatusDto.statut,
        },
      });

      this.logger.log(
        `Statut du client ${id} changé en ${changeStatusDto.statut}`,
      );

      // Convertir Decimal en number pour l'interface
      return {
        ...client,
        chiffreAffaires: client.chiffreAffaires
          ? Number(client.chiffreAffaires)
          : null,
      };
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Erreur lors du changement de statut: ${error.message}`,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Une erreur est survenue lors du changement de statut',
      );
    }
  }

  /**
   * Obtenir les statistiques d'un client
   */
  async getClientStats(clientId: string): Promise<IClientStats> {
    try {
      const client = await this.findOne(clientId);

      const [
        totalDossiers,
        dossiersActifs,
        dossiersFermes,
        totalFactures,
        facturesPayees,
        facturesImpayees,
        totalHonoraires,
        totalPaiements,
      ] = await Promise.all([
        this.prisma.dossier.count({ where: { clientId } }),
        this.prisma.dossier.count({
          where: {
            clientId,
            statut: { in: [StatutDossier.OUVERT, StatutDossier.EN_COURS] },
          },
        }),
        this.prisma.dossier.count({
          where: { clientId, statut: StatutDossier.CLOS },
        }),
        this.prisma.facture.count({ where: { clientId } }),
        this.prisma.facture.count({
          where: { clientId, statut: StatutFacture.PAYEE },
        }),
        this.prisma.facture.count({
          where: {
            clientId,
            statut: { in: [StatutFacture.IMPAYEE, StatutFacture.PARTIELLE] },
          },
        }),
        this.prisma.facture.aggregate({
          where: { clientId },
          _sum: { montant: true },
        }),
        this.prisma.paiement.aggregate({
          where: { clientId },
          _sum: { montant: true },
        }),
      ]);

      return {
        totalDossiers,
        dossiersActifs,
        dossiersFermes,
        totalFactures,
        facturesPayees,
        facturesImpayees,
        totalHonoraires: Number(totalHonoraires._sum.montant) || 0,
        totalPaiements: Number(totalPaiements._sum.montant) || 0,
        soldeRestant:
          (Number(totalHonoraires._sum.montant) || 0) -
          (Number(totalPaiements._sum.montant) || 0),
        chiffreAffaires: Number(client.chiffreAffaires) || 0,
      };
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Erreur lors de la récupération des statistiques: ${error.message}`,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la récupération des statistiques',
      );
    }
  }

  /**
   * Obtenir les performances d'un client
   */
  async getClientPerformance(clientId: string): Promise<IClientPerformance> {
    try {
      await this.findOne(clientId);

      const dossiers = await this.prisma.dossier.findMany({
        where: { clientId },
        select: {
          statut: true,
          creeLe: true,
          modifieLe: true,
        },
      });

      const totalDossiers = dossiers.length;
      const dossiersFermes = dossiers.filter(
        (d) => d.statut === StatutDossier.CLOS,
      ).length;

      const delaisMoyens =
        dossiers
          .filter((d) => d.statut === StatutDossier.CLOS)
          .map((d) => {
            const debut = new Date(d.creeLe);
            const fin = new Date(d.modifieLe);
            return (fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24);
          })
          .reduce((acc, val) => acc + val, 0) / (dossiersFermes || 1);

      const satisfactionData = await this.prisma.satisfaction.aggregate({
        where: { clientId },
        _avg: { note: true },
        _count: { id: true },
      });

      return {
        tauxReussite:
          totalDossiers > 0 ? (dossiersFermes / totalDossiers) * 100 : 0,
        delaiMoyenTraitement: Math.round(delaisMoyens),
        satisfactionMoyenne: satisfactionData._avg.note || 0,
        nombreEvaluations: satisfactionData._count.id,
      };
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Erreur lors de la récupération des performances: ${error.message}`,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la récupération des performances',
      );
    }
  }

  /**
   * Obtenir l'activité récente d'un client
   */
  async getClientActivity(
    clientId: string,
    limit: number = 20,
  ): Promise<IClientActivity[]> {
    try {
      await this.findOne(clientId);

      const [dossiers, factures, paiements, notes] = await Promise.all([
        this.prisma.dossier.findMany({
          where: { clientId },
          select: {
            id: true,
            titre: true,
            creeLe: true,
            modifieLe: true,
          },
          orderBy: { modifieLe: 'desc' },
          take: limit,
        }),
        this.prisma.facture.findMany({
          where: { clientId },
          select: {
            id: true,
            numeroFacture: true,
            creeLe: true,
            modifieLe: true,
          },
          orderBy: { modifieLe: 'desc' },
          take: limit,
        }),
        this.prisma.paiement.findMany({
          where: { clientId },
          select: {
            id: true,
            montant: true,
            datePayement: true,
          },
          orderBy: { datePayement: 'desc' },
          take: limit,
        }),
        this.prisma.note.findMany({
          where: { clientId },
          select: {
            id: true,
            contenu: true,
            creeLe: true,
          },
          orderBy: { creeLe: 'desc' },
          take: limit,
        }),
      ]);

      const activities: IClientActivity[] = [
        ...dossiers.map((d) => ({
          id: d.id,
          type: 'DOSSIER' as const,
          description: `Dossier: ${d.titre}`,
          date: d.modifieLe,
        })),
        ...factures.map((f) => ({
          id: f.id,
          type: 'FACTURE' as const,
          description: `Facture: ${f.numeroFacture}`,
          date: f.modifieLe,
        })),
        ...paiements.map((p) => ({
          id: p.id,
          type: 'PAIEMENT' as const,
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          description: `Paiement de ${p.montant} FCFA`,
          date: p.datePayement,
        })),
        ...notes.map((n) => ({
          id: n.id,
          type: 'NOTE' as const,
          description: n.contenu.substring(0, 100),
          date: n.creeLe,
        })),
      ];

      return activities
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Erreur lors de la récupération de l'activité: ${error.message}`,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Une erreur est survenue lors de la récupération de l'activité",
      );
    }
  }

  /**
   * Obtenir le résumé financier d'un client
   */
  async getFinancialSummary(
    clientId: string,
  ): Promise<IClientFinancialSummary> {
    try {
      await this.findOne(clientId);

      const [honoraires, paiements, factures, provisions] = await Promise.all([
        this.prisma.honoraire.aggregate({
          where: { clientId },
          _sum: { montantTTC: true },
        }),
        this.prisma.paiement.aggregate({
          where: { clientId },
          _sum: { montant: true },
        }),
        this.prisma.facture.findMany({
          where: { clientId },
          select: {
            montant: true,
            statut: true,
          },
        }),
        this.prisma.provision.aggregate({
          where: { clientId },
          _sum: { montant: true, solde: true }, //---------------------------------------------------
        }),
      ]);

      const totalFactures = factures.reduce(
        (sum, f) => sum + Number(f.montant),
        0,
      );
      const facturesImpayees = factures
        .filter(
          (f) =>
            f.statut === StatutFacture.IMPAYEE ||
            f.statut === StatutFacture.PARTIELLE,
        )
        .reduce((sum, f) => sum + Number(f.montant), 0);

      return {
        totalHonoraires: Number(honoraires._sum.montantTTC) || 0,
        totalPaiements: Number(paiements._sum.montant) || 0,
        totalFactures,
        facturesImpayees,
        soldeRestant: totalFactures - (Number(paiements._sum.montant) || 0),
        provisionsDisponibles: Number(provisions._sum.solde) || 0,
      };
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Erreur lors de la récupération du résumé financier: ${error.message}`,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la récupération du résumé financier',
      );
    }
  }

  /**
   * Ajouter un document d'identité pour un client
   */
  async addIdentityDocument(
    clientId: string,
    addDocumentDto: AddIdentityDocumentDto,
    uploadResult: any, // réponse de Cloudinary
  ): Promise<any> {
    await this.findOne(clientId);

    const document = await this.prisma.documentIdentite.create({
      data: {
        clientId,
        titre: addDocumentDto.titre,
        type: addDocumentDto.type,
        numero: addDocumentDto.numero,
        dateDelivrance: addDocumentDto.dateDelivrance
          ? new Date(addDocumentDto.dateDelivrance)
          : null,
        dateExpiration: addDocumentDto.dateExpiration
          ? new Date(addDocumentDto.dateExpiration)
          : null,
        lieuDelivrance: addDocumentDto.lieuDelivrance,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        url: uploadResult.secure_url,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        nomFichier: uploadResult.original_filename,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        tailleFichier: uploadResult.bytes,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        publicId: uploadResult.public_id,
      },
    });

    this.logger.log(`✅ Document d'identité ajouté pour le client ${clientId}`);
    return document;
  }

  /**
   * Ajouter une note pour un client
   */
  async addNote(
    clientId: string,
    auteurId: string,
    addNoteDto: AddClientNoteDto,
  ): Promise<any> {
    try {
      await this.findOne(clientId);

      const note = await this.prisma.note.create({
        data: {
          clientId,
          utilisateurId: auteurId,
          ...addNoteDto,
        },
        include: {
          utilisateur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
            },
          },
        },
      });

      this.logger.log(`Note ajoutée pour le client ${clientId}`);
      return note;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Erreur lors de l'ajout de la note: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Une erreur est survenue lors de l'ajout de la note",
      );
    }
  }

  /**
   * Actions en masse sur les clients
   */
  async bulkAction(
    bulkActionDto: BulkActionClientsDto,
  ): Promise<IBulkActionResult> {
    try {
      const { clientIds, action, newStatus } = bulkActionDto;

      let processedCount = 0;
      let failedCount = 0;
      const errors: Array<{ clientId: string; error: string }> = [];

      for (const clientId of clientIds) {
        try {
          switch (action) {
            case BulkActionType.CHANGE_STATUS:
              if (!newStatus) {
                throw new BadRequestException(
                  'Le nouveau statut est requis pour cette action',
                );
              }
              await this.prisma.client.update({
                where: { id: clientId },
                data: { statut: newStatus },
              });
              break;

            case BulkActionType.SET_VIP:
              await this.prisma.client.update({
                where: { id: clientId },
                data: { statutVIP: true },
              });
              break;

            case BulkActionType.REMOVE_VIP:
              await this.prisma.client.update({
                where: { id: clientId },
                data: { statutVIP: false },
              });
              break;

            case BulkActionType.ARCHIVE:
              await this.prisma.client.update({
                where: { id: clientId },
                data: { statut: StatutClient.ARCHIVE },
              });
              break;

            case BulkActionType.DELETE: {
              // Vérifier si le client a des dossiers actifs
              const dossiersActifs = await this.prisma.dossier.count({
                where: {
                  clientId,
                  statut: {
                    in: [StatutDossier.OUVERT, StatutDossier.EN_COURS],
                  },
                },
              });

              if (dossiersActifs > 0) {
                throw new BadRequestException(
                  'Impossible de supprimer un client avec des dossiers actifs',
                );
              }

              await this.prisma.client.update({
                where: { id: clientId },
                data: { statut: StatutClient.ARCHIVE },
              });
              break;
            }

            default:
              throw new BadRequestException('Action non supportée');
          }

          processedCount++;
        } catch (error) {
          failedCount++;
          errors.push({
            clientId,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            error: error.message,
          });
        }
      }

      this.logger.log(
        `Action en masse effectuée: ${processedCount} succès, ${failedCount} échecs`,
      );

      return {
        success: failedCount === 0,
        processedCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined,
        message: `${processedCount} client(s) traité(s) avec succès${failedCount > 0 ? `, ${failedCount} échec(s)` : ''}`,
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Erreur lors de l'action en masse: ${error.message}`);
      throw new InternalServerErrorException(
        "Une erreur est survenue lors de l'action en masse",
      );
    }
  }

  /**
   * Marquer la dernière visite d'un client
   */
  async markLastVisit(clientId: string): Promise<IClient> {
    try {
      const client = await this.prisma.client.update({
        where: { id: clientId },
        data: { derniereVisite: new Date() },
      });

      // Convertir Decimal en number pour l'interface
      return {
        ...client,
        chiffreAffaires: client.chiffreAffaires
          ? Number(client.chiffreAffaires)
          : null,
      };
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Erreur lors de la mise à jour de la dernière visite: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la mise à jour',
      );
    }
  }

  /**
   * Obtenir les clients inactifs (sans activité depuis X jours)
   */
  async getInactiveClients(
    daysSinceLastActivity: number = 90,
  ): Promise<IClient[]> {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysSinceLastActivity);

      const clients = await this.prisma.client.findMany({
        where: {
          statut: StatutClient.ACTIF,
          OR: [
            {
              derniereVisite: {
                lt: dateThreshold,
              },
            },
            {
              derniereVisite: null,
              creeLe: {
                lt: dateThreshold,
              },
            },
          ],
        },
        orderBy: {
          derniereVisite: 'asc',
        },
      });

      // Convertir Decimal en number pour l'interface
      return clients.map((client) => ({
        ...client,
        chiffreAffaires: client.chiffreAffaires
          ? Number(client.chiffreAffaires)
          : null,
      }));
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Erreur lors de la récupération des clients inactifs: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la récupération des clients inactifs',
      );
    }
  }

  /**
   * Obtenir la liste des statuts disponibles
   */
  getAvailableStatuses(): { value: string; label: string }[] {
    return Object.values(StatutClient).map((statut) => ({
      value: statut,
      label: statut,
    }));
  }

  /**
   * Supprimer un client (soft delete)
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const client = await this.findOne(id);

      // Vérifier si le client a des dossiers actifs
      const dossiersActifs =
        client.dossiers?.filter(
          (d) =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            d.statut === StatutDossier.OUVERT ||
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            d.statut === StatutDossier.EN_COURS,
        ).length || 0;

      if (dossiersActifs > 0) {
        throw new BadRequestException(
          'Impossible de supprimer un client avec des dossiers actifs',
        );
      }

      // Archiver le client au lieu de le supprimer
      await this.prisma.client.update({
        where: { id },
        data: { statut: StatutClient.ARCHIVE },
      });

      this.logger.log(`Client archivé: ${id}`);
      return {
        message: 'Client archivé avec succès',
      };
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Erreur lors de la suppression du client: ${error.message}`,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la suppression du client',
      );
    }
  }
  // Dans clients.service.ts
  async getGlobalStats(): Promise<any> {
    const [total, actifs, inactifs, vip, dossiersActifs, facturesImpayees] =
      await Promise.all([
        this.prisma.client.count(),
        this.prisma.client.count({ where: { statut: StatutClient.ACTIF } }),
        this.prisma.client.count({ where: { statut: StatutClient.INACTIF } }),
        this.prisma.client.count({ where: { statutVIP: true } }),
        this.prisma.dossier.count({
          where: {
            statut: { in: [StatutDossier.OUVERT, StatutDossier.EN_COURS] },
          },
        }),
        this.prisma.facture.count({
          where: {
            statut: { in: [StatutFacture.IMPAYEE, StatutFacture.PARTIELLE] },
          },
        }),
      ]);

    return {
      total,
      actifs,
      inactifs,
      vip,
      dossiersActifs,
      facturesImpayees,
    };
  }
}
