// src/dossiers/dossiers.service.ts
import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FilterDossierDto } from './dto/filter-dossier.dto';
import {
  Prisma,
  StatutDossier,
  StatutEvenement,
  TypeDossier,
} from '@prisma/client';
import { CreateDossierDto } from './dto/create-dossier.dto';
import { UpdateDossierDto } from './dto/update-dossier.dto';
import { CreateDossierNoteDto } from './dto/create-dossier-note.dto';
import { UpdateDossierNoteDto } from './dto/update-dossier-note.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as ExcelJS from 'exceljs';
import * as puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';

// Interface pour le type de retour de findAll
interface FindAllResult {
  totalCount: number;
  skip: number;
  take: number;
  data: DossierWithRelations[];
}

// Interface pour un dossier avec ses relations
type DossierWithRelations = Prisma.DossierGetPayload<{
  include: {
    client: true;
    responsable: true;
    contentieux: true;
    contrat: true;
    documents: true;
    evenements: true;
    factures: true;
    immobilier: true;
    messages: true;
    sinistreCorporel: true;
    sinistreMateriel: true;
    sinistreMortel: true;
    sport: true;
    taches: true;
    notes: true;
  };
}>;

@Injectable()
export class DossiersService {
  private readonly logger = new Logger(DossiersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(filters: FilterDossierDto): Promise<FindAllResult> {
    // Générer une clé de cache basée sur les filtres
    const cacheKey = `dossiers:${JSON.stringify(filters)}`;
    // Ajouter la clé à la liste des clés de dossiers
    const cacheKeysKey = 'dossiers:cache_keys';
    const cacheKeys =
      (await this.cacheManager.get<string[]>(cacheKeysKey)) || [];
    if (!cacheKeys.includes(cacheKey)) {
      cacheKeys.push(cacheKey);
      await this.cacheManager.set(cacheKeysKey, cacheKeys);
    }
    // Vérifier si les données sont en cache
    const cachedResult = await this.cacheManager.get<FindAllResult>(cacheKey);
    if (cachedResult) {
      this.logger.log(`Données récupérées depuis le cache: ${cacheKey}`);
      return cachedResult;
    }

    // Si non, exécuter la requête
    const result = await this.executeFindAllQuery(filters);
    // Mettre en cache pour une durée déterminée (ex: 5 minutes)
    await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }

  private async executeFindAllQuery(filters: FilterDossierDto) {
    const {
      statut,
      type,
      clientId,
      responsableId,
      skip,
      take,
      search,
      sortBy = 'creeLe', // champ de tri par défaut
      sortOrder = 'desc', // ordre de tri par défaut
    } = filters;

    const where: Prisma.DossierWhereInput = {
      // Exclure systématiquement les dossiers supprimés
      statut: { not: 'SUPPRIME' },
    };

    // Appliquer les filtres optionnels
    if (statut) {
      where.statut = statut;
    }
    if (type) {
      where.type = type;
    }
    if (clientId) {
      where.clientId = clientId;
    }
    if (responsableId) {
      where.responsableId = responsableId;
    }
    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { numeroUnique: { contains: search, mode: 'insensitive' } },
        {
          client: {
            OR: [
              { nom: { contains: search, mode: 'insensitive' } },
              { prenom: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    // Filtrage par date - CORRECTION
    if (filters.dateCreationDebut || filters.dateCreationFin) {
      where.creeLe = {};
      if (filters.dateCreationDebut) {
        where.creeLe.gte = new Date(filters.dateCreationDebut);
      }
      if (filters.dateCreationFin) {
        where.creeLe.lte = new Date(filters.dateCreationFin);
      }
    }
    if (filters.dateModificationDebut || filters.dateModificationFin) {
      where.modifieLe = {};
      if (filters.dateModificationDebut) {
        where.modifieLe.gte = new Date(filters.dateModificationDebut);
      }
      if (filters.dateModificationFin) {
        where.modifieLe.lte = new Date(filters.dateModificationFin);
      }
    }

    // Compter le total des dossiers valides
    const totalCount = await this.prisma.dossier.count({ where });

    // Déterminer l'ordre de tri
    let orderBy: Prisma.DossierOrderByWithRelationInput = {};
    // Gérer le tri par colonne
    switch (sortBy) {
      case 'numeroUnique':
        orderBy = { numeroUnique: sortOrder };
        break;
      case 'titre':
        orderBy = { titre: sortOrder };
        break;
      case 'statut':
        orderBy = { statut: sortOrder };
        break;
      case 'type':
        orderBy = { type: sortOrder };
        break;
      case 'client':
        orderBy = { client: { nom: sortOrder } };
        break;
      case 'responsable':
        orderBy = { responsable: { nom: sortOrder } };
        break;
      case 'creeLe':
      default:
        orderBy = { creeLe: sortOrder };
        break;
    }

    // Récupérer les dossiers actifs uniquement
    const data = await this.prisma.dossier.findMany({
      where,
      skip,
      take,
      include: {
        client: true,
        responsable: true,
        contentieux: true,
        contrat: true,
        documents: true,
        evenements: true,
        factures: true,
        immobilier: true,
        messages: true,
        sinistreCorporel: true,
        sinistreMateriel: true,
        sinistreMortel: true,
        sport: true,
        taches: true,
        notes: true,
      },
      orderBy,
    });

    return {
      totalCount,
      skip,
      take,
      data,
    };
  }

  // ✅ Nouveau : récupérer un dossier par ID avec toutes les relations
  async findOne(id: string) {
    const dossier = await this.prisma.dossier.findUnique({
      where: { id, statut: { not: 'SUPPRIME' } }, // Exclure les dossiers supprimés
      include: {
        client: true,
        responsable: true,
        contentieux: true,
        contrat: true,
        documents: true,
        evenements: true,
        factures: true,
        immobilier: true,
        messages: true,
        sinistreCorporel: true,
        sinistreMateriel: true,
        sinistreMortel: true,
        sport: true,
        taches: true,
        notes: true,
      },
    });

    if (!dossier) {
      this.logger.warn(`Dossier with ID ${id} not found`);
      throw new NotFoundException(`Dossier with ID ${id} not found`);
    }

    return dossier;
  }

  /**
   * Créer un dossier avec un numéro unique fiable
   * Format : PREFIX + ANNEE(2 derniers chiffres) + incrément sur 4 chiffres
   * Exemple : SC25-0001  numero unique pour un sinistre corporel créé en 2025
   */
  async create(createDossierDto: CreateDossierDto, etape?: number) {
    const { titre, type, description, clientId, responsableId, statut } =
      createDossierDto;

    // Vérifier le client
    const client = await this.prisma.client.findUnique({
      where: { id: clientId, statut: 'ACTIF' },
    });
    if (!client) {
      throw new NotFoundException(`Client avec ID ${clientId} introuvable`);
    }

    // Vérifier le responsable
    if (responsableId) {
      const responsable = await this.prisma.utilisateur.findUnique({
        where: { id: responsableId, statut: 'ACTIF' },
      });
      if (!responsable) {
        throw new NotFoundException(
          `Responsable avec ID ${responsableId} introuvable`,
        );
      }
    }

    // Préfixes selon le type de dossier
    const prefixMap: Record<string, string> = {
      SINISTRE_CORPOREL: 'SC',
      SINISTRE_MATERIEL: 'SM',
      SINISTRE_MORTEL: 'SMO',
      IMMOBILIER: 'IM',
      SPORT: 'SP',
      CONTRAT: 'CT',
      CONTENTIEUX: 'CO',
      AUTRE: 'AU',
    };

    const prefix = prefixMap[type];
    const year = new Date().getFullYear().toString().slice(-2); // ex: "25" pour 2025

    // ✅ Transaction pour garantir l'unicité et la cohérence
    const dossier = await this.prisma.$transaction(async (tx) => {
      // Trouver le dernier dossier du même type et année
      const lastDossier = await tx.dossier.findFirst({
        where: {
          type,
          numeroUnique: { startsWith: `${prefix}${year}` },
        },
        orderBy: { numeroUnique: 'desc' },
      });

      // Déterminer le prochain numéro incrémental
      let increment = 1;
      if (lastDossier) {
        const lastNumber = parseInt(lastDossier.numeroUnique.slice(-4), 10);
        if (!isNaN(lastNumber)) {
          increment = lastNumber + 1;
        }
      }

      // Générer le numéro unique final
      const numeroUnique = `${prefix}${year}-${increment.toString().padStart(4, '0')}`;

      // Déterminer le statut en fonction de l'étape
      const dossierStatut =
        etape === 1 ? ('BROUILLON' as StatutDossier) : statut || 'OUVERT';

      // ✅ Création du dossier principal
      const dossierCree = await tx.dossier.create({
        data: {
          titre,
          type,
          description,
          clientId,
          responsableId: responsableId || null,
          statut: dossierStatut,
          numeroUnique,
        },
        include: {
          client: true,
          responsable: true,
        },
      });

      // Si ce n'est pas un brouillon et qu'il y a des détails spécifiques
      if (etape !== 1 && createDossierDto.detailsSpecifiques) {
        const dataSpec = createDossierDto.detailsSpecifiques;

        switch (type) {
          case 'SINISTRE_CORPOREL':
            await tx.sinistreCorporel.create({
              data: { ...dataSpec, dossierId: dossierCree.id },
            });
            break;
          case 'SINISTRE_MATERIEL':
            await tx.sinistreMateriel.create({
              data: { ...dataSpec, dossierId: dossierCree.id },
            });
            break;
          case 'SINISTRE_MORTEL':
            await tx.sinistreMortel.create({
              data: { ...dataSpec, dossierId: dossierCree.id },
            });
            break;
          case 'IMMOBILIER':
            await tx.immobilier.create({
              data: { ...dataSpec, dossierId: dossierCree.id },
            });
            break;
          case 'SPORT':
            await tx.sport.create({
              data: { ...dataSpec, dossierId: dossierCree.id },
            });
            break;
          case 'CONTENTIEUX':
            await tx.contentieux.create({
              data: { ...dataSpec, dossierId: dossierCree.id },
            });
            break;
          case 'CONTRAT':
            await tx.contrat.create({
              data: { ...dataSpec, dossierId: dossierCree.id },
            });
            break;
          case 'AUTRE':
            await tx.autre.create({
              data: { champs: dataSpec, dossierId: dossierCree.id },
            });
            break;
        }
      }

      // Créer les tâches initiales si fournies
      if (createDossierDto.taches && createDossierDto.taches.length > 0) {
        await Promise.all(
          createDossierDto.taches.map((task) =>
            tx.tache.create({
              data: {
                dossierId: dossierCree.id,
                titre: task.titre,
                description: task.description,
                assigneeId: task.assigneeId,
                creeParId: createDossierDto.responsableId || 'system',
                priorite: task.priorite || 'MOYENNE',
                dateLimite: task.dateLimite,
              },
            }),
          ),
        );
      }

      // 🔚 Retourner le dossier complet avec toutes ses relations
      return await tx.dossier.findUnique({
        where: { id: dossierCree.id },
        include: {
          client: true,
          responsable: true,
          contentieux: true,
          contrat: true,
          documents: true,
          evenements: true,
          factures: true,
          immobilier: true,
          messages: true,
          sinistreCorporel: true,
          sinistreMateriel: true,
          sinistreMortel: true,
          sport: true,
          taches: true,
          notes: true,
        },
      });
    });

    if (!dossier) {
      throw new Error("Erreur interne : le dossier n'a pas été créé");
    }

    this.logger.log(
      `✅ Dossier créé avec numéro unique ${dossier.numeroUnique}`,
    );
    // Invalider le cache après création
    await this.invalidateDossierCache();
    return dossier;
  }

  /**
   * Mettre à jour un dossier existant
   */
  async update(
    id: string,
    updateDossierDto: UpdateDossierDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userId: string,
  ) {
    const {
      clientId,
      responsableId,
      documents,
      taches,
      utilisateurId,
      ...updateData
    } = updateDossierDto;

    const dossier = await this.prisma.dossier.findUnique({
      where: { id, statut: { not: 'SUPPRIME' } },
    });
    if (!dossier) throw new NotFoundException(`Dossier ${id} introuvable`);

    // 🧭 Vérification client/responsable (inchangée)
    if (clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId, statut: 'ACTIF' },
      });
      if (!client)
        throw new NotFoundException(`Client ${clientId} introuvable`);
    }

    if (responsableId) {
      const responsable = await this.prisma.utilisateur.findUnique({
        where: { id: responsableId },
      });
      if (!responsable)
        throw new NotFoundException(`Responsable ${responsableId} introuvable`);
    }

    // ⚙️ Mise à jour du dossier
    const updated = await this.prisma.dossier.update({
      where: { id, statut: { not: 'SUPPRIME' } },
      data: {
        ...updateData,
        clientId: clientId ?? dossier.clientId,
        responsableId: responsableId ?? dossier.responsableId,
      },
      include: {
        client: true,
        responsable: true,
        contentieux: true,
        contrat: true,
        evenements: true,
        factures: true,
        immobilier: true,
        messages: true,
        sinistreCorporel: true,
        sinistreMateriel: true,
        sinistreMortel: true,
        sport: true,
        taches: true,
        notes: true,
        documents: true,
      },
    });

    // 🗂️ Gérer les documents
    if (documents && documents.length > 0) {
      await this.addDocumentsToDossier(
        id,
        documents,
        responsableId || utilisateurId || 'system',
      );
    }

    // ✅ Gérer les tâches séparément
    if (taches && taches.length > 0) {
      await this.prisma.tache.createMany({
        data: taches.map((t) => ({
          dossierId: id,
          titre: t.titre,
          description: t.description,
          assigneeId: t.assigneeId,
          priorite: t.priorite,
          dateLimite: t.dateLimite,
          statut: 'A_FAIRE',
          creeParId: utilisateurId || responsableId || 'system', // 👈 ici l’erreur est réglée
        })),
      });
    }

    this.logger.log(`✅ Dossier ${id} mis à jour avec succès`);
    await this.invalidateDossierCache();
    return updated;
  }

  /**
   * Mettre à jour uniquement le statut d'un dossier
   */
  async updateStatus(id: string, newStatus: StatutDossier) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id, statut: { not: 'SUPPRIME' } },
    });

    if (!dossier) {
      this.logger.warn(
        `❌ Tentative de changement de statut sur dossier inexistant: ${id}`,
      );
      throw new NotFoundException(`Dossier avec ID ${id} introuvable`);
    }

    // Mise à jour uniquement du statut
    const updated = await this.prisma.dossier.update({
      where: { id },
      data: { statut: newStatus },
      include: {
        client: true,
        responsable: true,
      },
    });

    this.logger.log(
      `✅ Statut du dossier ${id} mis à jour: ${dossier.statut} ➝ ${newStatus}`,
    );

    return {
      message: `Statut du dossier mis à jour avec succès`,
      dossier: updated,
    };
  }

  /**
   * Soft delete d'un dossier (statut = SUPPRIME)
   */
  async softDelete(id: string, utilisateurId?: string) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id, statut: { not: 'SUPPRIME' } },
    });
    if (!dossier) {
      this.logger.warn(
        `❌ Tentative de suppression d'un dossier inexistant: ${id}`,
      );
      throw new NotFoundException(`Dossier avec ID ${id} introuvable`);
    }

    // Vérifier si déjà supprimé
    if (dossier.statut === 'SUPPRIME') {
      this.logger.warn(`⚠️ Dossier ${id} déjà marqué comme supprimé`);
      return {
        message: `Dossier déjà supprimé`,
        dossier,
      };
    }

    // Mettre à jour le statut
    const deleted = await this.prisma.dossier.update({
      where: { id },
      data: {
        statut: 'SUPPRIME',
      },
      include: {
        client: true,
        responsable: true,
      },
    });

    // Journal d'audit (optionnel mais recommandé)
    await this.prisma.journalAudit.create({
      data: {
        utilisateurId: utilisateurId || 'system',
        action: 'SUPPRESSION',
        typeCible: 'DOSSIER',
        cibleId: id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ancienneValeur: dossier as any,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        nouvelleValeur: { statut: 'SUPPRIME' } as any,
      },
    });

    this.logger.log(`🗑️ Dossier ${id} marqué comme SUPPRIME`);
    // Invalider le cache après création
    await this.invalidateDossierCache();
    return {
      message: `Dossier supprimé (soft delete)`,
      dossier: deleted,
    };
  }

  /**
   * Restaurer un dossier archivé
   */
  async restoreDossier(id: string, utilisateurId?: string) {
    // Vérifier que le dossier existe et est archivé
    const dossier = await this.prisma.dossier.findUnique({
      where: { id, statut: 'ARCHIVE' },
    });
    if (!dossier) {
      this.logger.warn(
        `❌ Tentative de restauration d'un dossier non archivé: ${id}`,
      );
      throw new NotFoundException(
        `Dossier avec ID ${id} non trouvé ou non archivé`,
      );
    }

    // Restaurer le dossier
    const restored = await this.prisma.dossier.update({
      where: { id },
      data: { statut: 'OUVERT' },
      include: {
        client: true,
        responsable: true,
      },
    });

    // Journal d'audit
    await this.prisma.journalAudit.create({
      data: {
        utilisateurId: utilisateurId || 'system',
        action: 'RESTAURATION',
        typeCible: 'DOSSIER',
        cibleId: id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ancienneValeur: { statut: 'ARCHIVE' } as any,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        nouvelleValeur: { statut: 'OUVERT' } as any,
      },
    });

    this.logger.log(`✅ Dossier ${id} restauré avec succès`);
    return {
      message: `Dossier restauré avec succès`,
      dossier: restored,
    };
  }

  /**
   * Archiver un dossier
   */
  async archiveDossier(id: string, utilisateurId?: string) {
    // Vérifier que le dossier existe et n'est pas déjà archivé
    const dossier = await this.prisma.dossier.findUnique({
      where: { id, statut: { notIn: ['SUPPRIME', 'ARCHIVE'] } },
    });

    if (!dossier) {
      this.logger.warn(
        `❌ Tentative d'archivage d'un dossier inexistant ou déjà archivé: ${id}`,
      );
      throw new NotFoundException(
        `Dossier avec ID ${id} introuvable ou déjà archivé`,
      );
    }

    // Archiver le dossier
    const archived = await this.prisma.dossier.update({
      where: { id },
      data: { statut: 'ARCHIVE' },
      include: {
        client: true,
        responsable: true,
      },
    });

    // Journal d'audit
    await this.prisma.journalAudit.create({
      data: {
        utilisateurId: utilisateurId || 'system',
        action: 'ARCHIVAGE',
        typeCible: 'DOSSIER',
        cibleId: id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ancienneValeur: { statut: dossier.statut } as any,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        nouvelleValeur: { statut: 'ARCHIVE' } as any,
      },
    });

    this.logger.log(`📁 Dossier ${id} archivé avec succès`);
    return {
      message: `Dossier archivé avec succès`,
      dossier: archived,
    };
  }

  /**
   * Récupérer l'historique d'audit d'un dossier
   */
  async getAuditHistory(dossierId: string) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
    });

    if (!dossier) {
      this.logger.warn(`Dossier with ID ${dossierId} not found`);
      throw new NotFoundException(`Dossier with ID ${dossierId} not found`);
    }

    // Récupérer l'historique d'audit
    const auditHistory = await this.prisma.journalAudit.findMany({
      where: {
        typeCible: 'DOSSIER',
        cibleId: dossierId,
      },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
      orderBy: { creeLe: 'desc' },
    });

    return {
      dossierId,
      total: auditHistory.length,
      auditHistory,
    };
  }

  /**
   * Récupérer les factures liées à un dossier
   */
  async getFactures(dossierId: string) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
    });

    if (!dossier) {
      this.logger.warn(`Dossier with ID ${dossierId} not found`);
      throw new NotFoundException(`Dossier with ID ${dossierId} not found`);
    }

    // Récupérer les factures
    const factures = await this.prisma.facture.findMany({
      where: { dossierId },
      include: {
        client: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
      orderBy: { creeLe: 'desc' },
    });

    return {
      dossierId,
      total: factures.length,
      factures,
    };
  }

  /**
   * Créer une facture pour un dossier
   */
  async createFacture(
    dossierId: string,
    createFactureDto: {
      montant: number;
      dateEcheance: Date;
      clientId?: string;
    },
    //utilisateurId?: string,
  ) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId, statut: { not: 'SUPPRIME' } },
      include: { client: true },
    });

    if (!dossier) {
      throw new NotFoundException(`Dossier ${dossierId} introuvable`);
    }

    // Utiliser le client du dossier si non spécifié
    const clientId = createFactureDto.clientId || dossier.clientId;

    // Créer la facture
    const facture = await this.prisma.facture.create({
      data: {
        dossierId,
        clientId,
        montant: createFactureDto.montant,
        dateEcheance: createFactureDto.dateEcheance,
      },
      include: {
        client: true,
        dossier: {
          select: { id: true, titre: true, numeroUnique: true },
        },
      },
    });

    this.logger.log(`✅ Facture créée pour le dossier ${dossierId}`);
    return facture;
  }

  /**
   * Créer une tâche pour un dossier
   */
  async createTask(
    dossierId: string,
    createTaskDto: {
      titre: string;
      description?: string;
      assigneeId?: string;
      priorite?: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE';
      dateLimite?: Date;
    },
    utilisateurId: string,
  ) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId, statut: { not: 'SUPPRIME' } },
    });

    if (!dossier) {
      throw new NotFoundException(`Dossier ${dossierId} introuvable`);
    }

    // Vérifier que l'assigné existe si spécifié
    if (createTaskDto.assigneeId) {
      const assignee = await this.prisma.utilisateur.findUnique({
        where: { id: createTaskDto.assigneeId, statut: 'ACTIF' },
      });
      if (!assignee) {
        throw new NotFoundException(
          `Utilisateur avec ID ${createTaskDto.assigneeId} introuvable`,
        );
      }
    }

    // Créer la tâche
    const task = await this.prisma.tache.create({
      data: {
        dossierId,
        titre: createTaskDto.titre,
        description: createTaskDto.description,
        assigneeId: createTaskDto.assigneeId,
        creeParId: utilisateurId,
        priorite: createTaskDto.priorite || 'MOYENNE',
        dateLimite: createTaskDto.dateLimite,
      },
      include: {
        assignee: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: {
          select: { id: true, titre: true, numeroUnique: true },
        },
      },
    });

    this.logger.log(`✅ Tâche créée pour le dossier ${dossierId}`);
    return task;
  }

  /**
   * Envoyer un message dans le chat d'un dossier
   */
  async sendMessage(
    dossierId: string,
    messageDto: {
      contenu: string;
    },
    utilisateurId: string,
  ) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId, statut: { not: 'SUPPRIME' } },
    });

    if (!dossier) {
      throw new NotFoundException(`Dossier ${dossierId} introuvable`);
    }

    // Créer le message
    const message = await this.prisma.messageChat.create({
      data: {
        dossierId,
        expediteurId: utilisateurId,
        contenu: messageDto.contenu,
      },
      include: {
        expediteur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: {
          select: { id: true, titre: true, numeroUnique: true },
        },
      },
    });

    this.logger.log(`✅ Message envoyé dans le chat du dossier ${dossierId}`);
    return message;
  }

  /**
   * Mettre à jour les détails spécifiques d'un dossier selon son type
   */
  async updateSpecificDetails(
    id: string,
    type: TypeDossier,
    detailsSpecifiques: any,
    utilisateurId?: string,
  ) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id, statut: { not: 'SUPPRIME' } },
    });

    if (!dossier) {
      throw new NotFoundException(`Dossier avec ID ${id} introuvable`);
    }

    // Journal d'audit pour l'ancienne valeur
    let ancienneValeur: any = null;
    switch (type) {
      case 'SINISTRE_CORPOREL':
        ancienneValeur = await this.prisma.sinistreCorporel.findUnique({
          where: { dossierId: id },
        });
        break;
      case 'SINISTRE_MATERIEL':
        ancienneValeur = await this.prisma.sinistreMateriel.findUnique({
          where: { dossierId: id },
        });
        break;
      // ... autres cas
    }

    // Mettre à jour selon le type
    let updatedDetails: any = null;
    switch (type) {
      case 'SINISTRE_CORPOREL':
        updatedDetails = await this.prisma.sinistreCorporel.upsert({
          where: { dossierId: id },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          update: { ...detailsSpecifiques },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          create: { ...detailsSpecifiques, dossierId: id },
        });
        break;
      case 'SINISTRE_MATERIEL':
        updatedDetails = await this.prisma.sinistreMateriel.upsert({
          where: { dossierId: id },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          update: { ...detailsSpecifiques },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          create: { ...detailsSpecifiques, dossierId: id },
        });
        break;
      case 'SINISTRE_MORTEL':
        updatedDetails = await this.prisma.sinistreMortel.upsert({
          where: { dossierId: id },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          update: { ...detailsSpecifiques },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          create: { ...detailsSpecifiques, dossierId: id },
        });
        break;
      case 'IMMOBILIER':
        updatedDetails = await this.prisma.immobilier.upsert({
          where: { dossierId: id },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          update: { ...detailsSpecifiques },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          create: { ...detailsSpecifiques, dossierId: id },
        });
        break;
      case 'SPORT':
        updatedDetails = await this.prisma.sport.upsert({
          where: { dossierId: id },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          update: { ...detailsSpecifiques },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          create: { ...detailsSpecifiques, dossierId: id },
        });
        break;
      case 'CONTRAT':
        updatedDetails = await this.prisma.contrat.upsert({
          where: { dossierId: id },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          update: { ...detailsSpecifiques },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          create: { ...detailsSpecifiques, dossierId: id },
        });
        break;
      case 'CONTENTIEUX':
        updatedDetails = await this.prisma.contentieux.upsert({
          where: { dossierId: id },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          update: { ...detailsSpecifiques },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          create: { ...detailsSpecifiques, dossierId: id },
        });
        break;
      case 'AUTRE':
        updatedDetails = await this.prisma.autre.upsert({
          where: { dossierId: id },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          update: { champs: detailsSpecifiques },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          create: { champs: detailsSpecifiques, dossierId: id },
        });
        break;
    }

    // Journal d'audit
    await this.prisma.journalAudit.create({
      data: {
        utilisateurId: utilisateurId || 'system',
        action: 'MODIFICATION_DETAILS_SPECIFIQUES',
        typeCible: 'DOSSIER',
        cibleId: id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ancienneValeur,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        nouvelleValeur: updatedDetails,
      },
    });

    this.logger.log(`✅ Détails spécifiques mis à jour pour le dossier ${id}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return updatedDetails;
  }

  /**
   * Exporter un dossier au format PDF
   */
  async exportDossierPDF(id: string, utilisateurId?: string) {
    // Récupérer le dossier complet
    const dossier = await this.findOne(id);

    // Journal d'audit
    await this.prisma.journalAudit.create({
      data: {
        utilisateurId: utilisateurId || 'system',
        action: 'EXPORT_PDF',
        typeCible: 'DOSSIER',
        cibleId: id,
        nouvelleValeur: {
          format: 'pdf',
          numeroDossier: dossier.numeroUnique,
        },
      },
    });

    // Générer le PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `dossier_${dossier.numeroUnique}_${timestamp}.pdf`;

    try {
      // Générer le contenu HTML pour le PDF
      const htmlContent = this.generateHTMLForDossierPDF(dossier);
      // Utiliser Puppeteer pour générer le PDF
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      try {
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px',
          },
        });
        // Télécharger le fichier sur Cloudinary
        const uploadResult = await this.cloudinaryService.uploadBuffer(
          Buffer.from(pdfBuffer),
          filename,
          'exports',
        );
        this.logger.log(
          `✅ PDF du dossier ${id} téléchargé sur Cloudinary: ${uploadResult.secure_url}`,
        );
        return {
          message: 'PDF du dossier généré avec succès',
          fileUrl: uploadResult.secure_url,
          filename,
          publicId: uploadResult.public_id,
        };
      } finally {
        await browser.close();
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors de la génération du PDF du dossier ${id}:`,
        error,
      );
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(
        `Erreur lors de la génération du PDF du dossier: ${errorMessage}`,
      );
    }
  }

  /**
   * Générer le contenu HTML pour le PDF d'un dossier
   */
  private generateHTMLForDossierPDF(dossier: DossierWithRelations): string {
    const currentDate = new Date().toLocaleDateString('fr-FR');
    // Extraire les détails spécifiques selon le type
    let specificDetails = '';
    switch (dossier.type) {
      case 'SINISTRE_CORPOREL':
        if (dossier.sinistreCorporel) {
          specificDetails = `
            <h3>Détails du sinistre corporel</h3>
            <p><strong>Date de l'accident:</strong> ${dossier.sinistreCorporel.dateAccident ? new Date(dossier.sinistreCorporel.dateAccident).toLocaleDateString('fr-FR') : 'N/A'}</p>
            <p><strong>Lieu de l'accident:</strong> ${dossier.sinistreCorporel.lieuAccident || 'N/A'}</p>
            <p><strong>N° PV Police:</strong> ${dossier.sinistreCorporel.numeroPvPolice || 'N/A'}</p>
            <p><strong>Hôpital:</strong> ${dossier.sinistreCorporel.hopital || 'N/A'}</p>
            <p><strong>Gravité de la blessure:</strong> ${dossier.sinistreCorporel.graviteBlessure || 'N/A'}</p>
            <p><strong>Assureur:</strong> ${dossier.sinistreCorporel.assureur || 'N/A'}</p>
            <p><strong>N° Sinistre:</strong> ${dossier.sinistreCorporel.numeroSinistre || 'N/A'}</p>
            <p><strong>Préjudice estimé:</strong> ${dossier.sinistreCorporel.prejudice ? String(dossier.sinistreCorporel.prejudice) : 'N/A'}</p>
          `;
        }
        break;
      case 'SINISTRE_MATERIEL':
        if (dossier.sinistreMateriel) {
          specificDetails = `
            <h3>Détails du sinistre matériel</h3>
            <p><strong>Date de l'accident:</strong> ${dossier.sinistreMateriel.dateAccident ? new Date(dossier.sinistreMateriel.dateAccident).toLocaleDateString('fr-FR') : 'N/A'}</p>
            <p><strong>Lieu de l'accident:</strong> ${dossier.sinistreMateriel.lieuAccident || 'N/A'}</p>
            <p><strong>Catégorie de véhicule:</strong> ${dossier.sinistreMateriel.categorieVehicule || 'N/A'}</p>
            <p><strong>Marque:</strong> ${dossier.sinistreMateriel.marqueVehicule || 'N/A'}</p>
            <p><strong>Modèle:</strong> ${dossier.sinistreMateriel.modeleVehicule || 'N/A'}</p>
            <p><strong>Immatriculation:</strong> ${dossier.sinistreMateriel.immatriculation || 'N/A'}</p>
            <p><strong>N° Châssis:</strong> ${dossier.sinistreMateriel.numeroChassis || 'N/A'}</p>
            <p><strong>N° PV Police:</strong> ${dossier.sinistreMateriel.numeroPvPolice || 'N/A'}</p>
            <p><strong>Assureur:</strong> ${dossier.sinistreMateriel.assureur || 'N/A'}</p>
            <p><strong>N° Sinistre:</strong> ${dossier.sinistreMateriel.numeroSinistre || 'N/A'}</p>
            <p><strong>Estimation des dégâts:</strong> ${dossier.sinistreMateriel.estimationDegats ? String(dossier.sinistreMateriel.estimationDegats) : 'N/A'}</p>
          `;
        }
        break;
      case 'SINISTRE_MORTEL':
        if (dossier.sinistreMortel) {
          specificDetails = `
            <h3>Détails du sinistre mortel</h3>
            <p><strong>Date du décès:</strong> ${dossier.sinistreMortel.dateDeces ? new Date(dossier.sinistreMortel.dateDeces).toLocaleDateString('fr-FR') : 'N/A'}</p>
            <p><strong>Lieu du décès:</strong> ${dossier.sinistreMortel.lieuDeces || 'N/A'}</p>
            <p><strong>Certificat de décès:</strong> ${dossier.sinistreMortel.certificatDeces || 'N/A'}</p>
            <p><strong>Certificat médico-légal:</strong> ${dossier.sinistreMortel.certificatMedicoLegal || 'N/A'}</p>
            <p><strong>N° PV Police:</strong> ${dossier.sinistreMortel.numeroPvPolice || 'N/A'}</p>
            <p><strong>Cause du décès:</strong> ${dossier.sinistreMortel.causeDeces || 'N/A'}</p>
            <p><strong>Indemnité réclamée:</strong> ${dossier.sinistreMortel.indemniteReclamee ? String(dossier.sinistreMortel.indemniteReclamee) : 'N/A'}</p>
          `;
        }
        break;
      case 'IMMOBILIER':
        if (dossier.immobilier) {
          specificDetails = `
            <h3>Détails du dossier immobilier</h3>
            <p><strong>Adresse du bien:</strong> ${dossier.immobilier.adresseBien || 'N/A'}</p>
            <p><strong>N° Titre foncier:</strong> ${dossier.immobilier.numeroTitre || 'N/A'}</p>
            <p><strong>N° Cadastre:</strong> ${dossier.immobilier.numeroCadastre || 'N/A'}</p>
            <p><strong>Référence notaire:</strong> ${dossier.immobilier.referenceNotaire || 'N/A'}</p>
            <p><strong>Régime foncier:</strong> ${dossier.immobilier.regimeFoncier || 'N/A'}</p>
            <p><strong>Surface m²:</strong> ${dossier.immobilier.surfaceM2 ? String(dossier.immobilier.surfaceM2) : 'N/A'}</p>
            <p><strong>Type de litige:</strong> ${dossier.immobilier.typeLitige || 'N/A'}</p>
            <p><strong>Chef de quartier:</strong> ${dossier.immobilier.chefQuartier || 'N/A'}</p>
          `;
        }
        break;
      case 'SPORT':
        if (dossier.sport) {
          specificDetails = `
            <h3>Détails du dossier sport</h3>
            <p><strong>Club:</strong> ${dossier.sport.club || 'N/A'}</p>
            <p><strong>Compétition:</strong> ${dossier.sport.competition || 'N/A'}</p>
            <p><strong>Date de l'incident:</strong> ${dossier.sport.dateIncident ? new Date(dossier.sport.dateIncident).toLocaleDateString('fr-FR') : 'N/A'}</p>
            <p><strong>Instance sportive:</strong> ${dossier.sport.instanceSportive || 'N/A'}</p>
            <p><strong>Référence contrat:</strong> ${dossier.sport.referenceContrat || 'N/A'}</p>
          `;
        }
        break;
      case 'CONTRAT':
        if (dossier.contrat) {
          specificDetails = `
            <h3>Détails du contrat</h3>
            <p><strong>Partie A:</strong> ${dossier.contrat.partieA || 'N/A'}</p>
            <p><strong>Partie B:</strong> ${dossier.contrat.partieB || 'N/A'}</p>
            <p><strong>Date d'effet:</strong> ${dossier.contrat.dateEffet ? new Date(dossier.contrat.dateEffet).toLocaleDateString('fr-FR') : 'N/A'}</p>
            <p><strong>Date d'expiration:</strong> ${dossier.contrat.dateExpiration ? new Date(dossier.contrat.dateExpiration).toLocaleDateString('fr-FR') : 'N/A'}</p>
            <p><strong>Valeur du contrat:</strong> ${dossier.contrat.valeurContrat ? String(dossier.contrat.valeurContrat) : 'N/A'}</p>
            <p><strong>Loi applicable:</strong> ${dossier.contrat.loiApplicable || 'N/A'}</p>
            <p><strong>Référence notaire:</strong> ${dossier.contrat.referenceNotaire || 'N/A'}</p>
          `;
        }
        break;
      case 'CONTENTIEUX':
        if (dossier.contentieux) {
          specificDetails = `
            <h3>Détails du contentieux</h3>
            <p><strong>N° Affaire:</strong> ${dossier.contentieux.numeroAffaire || 'N/A'}</p>
            <p><strong>Tribunal:</strong> ${dossier.contentieux.tribunal || 'N/A'}</p>
            <p><strong>Juridiction:</strong> ${dossier.contentieux.juridiction || 'N/A'}</p>
            <p><strong>Demandeur:</strong> ${dossier.contentieux.demandeur || 'N/A'}</p>
            <p><strong>Défendeur:</strong> ${dossier.contentieux.defendeur || 'N/A'}</p>
            <p><strong>Avocat plaignant:</strong> ${dossier.contentieux.avocatPlaignant || 'N/A'}</p>
            <p><strong>Avocat défenseur:</strong> ${dossier.contentieux.avocatDefenseur || 'N/A'}</p>
            <p><strong>Étape de procédure:</strong> ${dossier.contentieux.etapeProcedure || 'N/A'}</p>
            <p><strong>Montant réclamé:</strong> ${dossier.contentieux.montantReclame ? String(dossier.contentieux.montantReclame) : 'N/A'}</p>
            <p><strong>Rapport huissier:</strong> ${dossier.contentieux.rapportHussier || 'N/A'}</p>
          `;
        }
        break;
    }
    // Générer le HTML
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Dossier ${dossier.numeroUnique}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          h1 {
            color: #2c3e50;
            text-align: center;
          }
          h2 {
            color: #3498db;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
          }
          h3 {
            color: #2980b9;
          }
          .header-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .info-block {
            margin-bottom: 20px;
          }
          .info-label {
            font-weight: bold;
            display: inline-block;
            width: 150px;
          }
          .meta-info {
            text-align: center;
            margin-bottom: 30px;
            color: #7f8c8d;
            font-size: 12px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
          }
        </style>
      </head>
      <body>
        <h1>Dossier ${dossier.numeroUnique}</h1>
        <div class="meta-info">
          <p>Généré le ${currentDate} | Cabinet Juridique 237</p>
        </div>
        
        <div class="header-info">
          <div>
            <h2>Informations générales</h2>
            <div class="info-block">
              <span class="info-label">Numéro:</span> ${dossier.numeroUnique}
            </div>
            <div class="info-block">
              <span class="info-label">Titre:</span> ${dossier.titre}
            </div>
            <div class="info-block">
              <span class="info-label">Type:</span> ${dossier.type}
            </div>
            <div class="info-block">
              <span class="info-label">Statut:</span> ${dossier.statut}
            </div>
            <div class="info-block">
              <span class="info-label">Date de création:</span> ${dossier.creeLe ? new Date(dossier.creeLe).toLocaleDateString('fr-FR') : 'N/A'}
            </div>
          </div>
          
          <div>
            <h2>Parties impliquées</h2>
            <div class="info-block">
              <span class="info-label">Client:</span> ${dossier.client ? `${dossier.client.prenom} ${dossier.client.nom}` : 'N/A'}
            </div>
            <div class="info-block">
              <span class="info-label">Responsable:</span> ${dossier.responsable ? `${dossier.responsable.prenom} ${dossier.responsable.nom}` : 'N/A'}
            </div>
          </div>
        </div>
        
        <div>
          <h2>Description</h2>
          <p>${dossier.description || 'Aucune description'}</p>
        </div>
        
        ${specificDetails}
        
        <div class="footer">
          <p>Cabinet Juridique 237 - Système de Gestion</p>
        </div>
      </body>
      </html>
    `;
  }

  // src/dossiers/dossiers.service.ts---------------------------------------------------------------
  async findDocuments(dossierId: string) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
    });

    if (!dossier) {
      this.logger.warn(`Dossier with ID ${dossierId} not found`);
      throw new NotFoundException(`Dossier with ID ${dossierId} not found`);
    }

    // Récupérer uniquement les documents actifs
    const documents = await this.prisma.document.findMany({
      where: {
        dossierId,
        statut: 'ACTIF', // On ne renvoie que les documents ACTIF par défaut
      },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
      orderBy: { creeLe: 'desc' },
    });

    return { dossierId, total: documents.length, documents };
  }

  // src/dossiers/dossiers.service.ts
  async findTasks(dossierId: string) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
    });

    if (!dossier) {
      this.logger.warn(`Dossier with ID ${dossierId} not found`);
      throw new NotFoundException(`Dossier with ID ${dossierId} not found`);
    }

    // Récupérer uniquement les tâches non supprimées
    const taches = await this.prisma.tache.findMany({
      where: {
        dossierId,
        statut: { not: 'SUPPRIME' }, // exclure les tâches supprimées
      },
      include: {
        assignee: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: {
          select: { id: true, titre: true, numeroUnique: true },
        },
      },
      orderBy: { creeLe: 'desc' },
    });

    return {
      dossierId,
      total: taches.length,
      taches,
    };
  }

  // src/dossiers/dossiers.service.ts
  async findCalendarEvents(dossierId: string) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
    });

    if (!dossier) {
      this.logger.warn(`Dossier with ID ${dossierId} not found`);
      throw new NotFoundException(`Dossier with ID ${dossierId} not found`);
    }

    // Récupérer les événements liés au dossier, uniquement ceux non supprimés
    const evenements = await this.prisma.evenementCalendrier.findMany({
      where: {
        dossierId,
        statut: { not: 'SUPPRIME' }, // Exclure les événements supprimés
      },
      include: {
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: {
          select: { id: true, titre: true, numeroUnique: true },
        },
      },
      orderBy: { debut: 'asc' }, // Trier par date de début
    });

    return {
      dossierId,
      total: evenements.length,
      evenements,
    };
  }

  // src/dossiers/dossiers.service.ts
  async findChatMessagesPaginated(
    dossierId: string,
    skip = 0,
    take = 20, // nombre de messages par batch
  ) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId, statut: { not: 'SUPPRIME' } },
    });

    if (!dossier) {
      this.logger.warn(`Dossier with ID ${dossierId} not found`);
      throw new NotFoundException(`Dossier with ID ${dossierId} not found`);
    }

    const totalCount = await this.prisma.messageChat.count({
      where: {
        dossierId,
        statut: { not: 'SUPPRIME' },
      },
    });

    const messages = await this.prisma.messageChat.findMany({
      where: {
        dossierId,
        statut: { not: 'SUPPRIME' },
      },
      include: {
        expediteur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: {
          select: { id: true, titre: true, numeroUnique: true },
        },
      },
      orderBy: { creeLe: 'asc' },
      skip,
      take,
    });

    return {
      dossierId,
      totalCount,
      skip,
      take,
      messages,
    };
  }

  // src/dossiers/dossiers.service.ts
  async findNotesPaginated(
    dossierId: string,
    skip = 0,
    take = 20, // par défaut 20 notes
  ) {
    // Vérifier que le dossier existe et n'est pas supprimé
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId, statut: { not: 'SUPPRIME' } },
    });

    if (!dossier) {
      this.logger.warn(`Dossier with ID ${dossierId} not found`);
      throw new NotFoundException(`Dossier with ID ${dossierId} not found`);
    }

    // Nombre total de notes actives
    const totalCount = await this.prisma.note.count({
      where: {
        dossierId,
        statut: 'ACTIF', // seulement les notes actives
      },
    });

    // Récupération des notes actives
    const notes = await this.prisma.note.findMany({
      where: {
        dossierId,
        statut: 'ACTIF',
      },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
      orderBy: { creeLe: 'desc' }, // la plus récente en premier
      skip,
      take,
    });

    return {
      dossierId,
      totalCount,
      skip,
      take,
      notes,
    };
  }

  // ✅ Ajouter une note interne
  async addNote(
    dossierId: string,
    createNoteDto: CreateDossierNoteDto,
    utilisateurId: string,
  ) {
    // Vérifier que le dossier existe et n'est pas supprimé
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId, statut: { not: 'SUPPRIME' } },
    });
    if (!dossier) {
      throw new NotFoundException(`Dossier ${dossierId} introuvable`);
    }

    return await this.prisma.note.create({
      data: {
        contenu: createNoteDto.contenu,
        dossierId,
        clientId: dossier.clientId,
        utilisateurId,
      },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });
  }

  // ✅ Modifier une note interne
  async updateNote(
    dossierId: string,
    noteId: string,
    updateNoteDto: UpdateDossierNoteDto,
  ) {
    // Vérifier que la note existe et est active
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });
    if (!note || note.statut === 'SUPPRIME') {
      throw new NotFoundException(`Note ${noteId} introuvable ou supprimée`);
    }

    // Vérifier que le dossier correspond
    if (note.dossierId !== dossierId) {
      throw new NotFoundException(
        `La note ${noteId} n'appartient pas au dossier ${dossierId}`,
      );
    }

    return await this.prisma.note.update({
      where: { id: noteId },
      data: {
        contenu: updateNoteDto.contenu,
      },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });
  }

  // ✅ Supprimer une note (soft delete)
  async softDeleteNote(dossierId: string, noteId: string) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note || note.statut === 'SUPPRIME') {
      throw new NotFoundException(
        `Note ${noteId} introuvable ou déjà supprimée`,
      );
    }

    if (note.dossierId !== dossierId) {
      throw new NotFoundException(
        `La note ${noteId} n'appartient pas au dossier ${dossierId}`,
      );
    }

    const deleted = await this.prisma.note.update({
      where: { id: noteId },
      data: { statut: 'SUPPRIME' },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });

    return { message: 'Note supprimée (soft delete)', note: deleted };
  }

  // src/dossiers/dossiers.service.ts
  async findEvents(dossierId: string) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
    });

    if (!dossier) {
      this.logger.warn(`Dossier with ID ${dossierId} not found`);
      throw new NotFoundException(`Dossier with ID ${dossierId} not found`);
    }

    // Récupérer les événements assignés au dossier
    const evenements = await this.prisma.evenementCalendrier.findMany({
      where: {
        dossierId,
        statut: { not: 'SUPPRIME' }, // exclure les événements supprimés
      },
      include: {
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: {
          select: { id: true, titre: true, numeroUnique: true },
        },
      },
      orderBy: { debut: 'asc' }, // tri chronologique
    });

    return {
      dossierId,
      total: evenements.length,
      evenements,
    };
  }

  // Créer un événement pour un dossier
  async createEvent(
    dossierId: string,
    createEventDto: CreateEventDto,
    utilisateurId: string,
  ) {
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId, statut: { not: 'SUPPRIME' } },
    });
    if (!dossier) {
      throw new NotFoundException(`Dossier ${dossierId} introuvable`);
    }

    const event = await this.prisma.evenementCalendrier.create({
      data: {
        ...createEventDto,
        dossierId,
        creeParId: utilisateurId,
        statut: StatutEvenement.PREVU,
      },
      include: {
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: { select: { id: true, titre: true, numeroUnique: true } },
      },
    });

    this.logger.log(`✅ Événement créé pour le dossier ${dossierId}`);
    return event;
  }

  // Modifier un événement
  async updateEvent(
    dossierId: string,
    eventId: string,
    updateEventDto: UpdateEventDto,
  ) {
    const event = await this.prisma.evenementCalendrier.findUnique({
      where: { id: eventId },
    });
    if (!event || event.statut === 'SUPPRIME') {
      throw new NotFoundException(
        `Événement ${eventId} introuvable ou supprimé`,
      );
    }

    if (event.dossierId !== dossierId) {
      throw new NotFoundException(
        `Événement ${eventId} n'appartient pas au dossier ${dossierId}`,
      );
    }

    const updated = await this.prisma.evenementCalendrier.update({
      where: { id: eventId },
      data: updateEventDto,
      include: {
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: { select: { id: true, titre: true, numeroUnique: true } },
      },
    });

    this.logger.log(`✅ Événement ${eventId} mis à jour`);
    return updated;
  }

  // Supprimer un événement (soft delete)
  async softDeleteEvent(dossierId: string, eventId: string) {
    const event = await this.prisma.evenementCalendrier.findUnique({
      where: { id: eventId },
    });
    if (!event || event.statut === 'SUPPRIME') {
      throw new NotFoundException(
        `Événement ${eventId} introuvable ou déjà supprimé`,
      );
    }

    if (event.dossierId !== dossierId) {
      throw new NotFoundException(
        `Événement ${eventId} n'appartient pas au dossier ${dossierId}`,
      );
    }

    const deleted = await this.prisma.evenementCalendrier.update({
      where: { id: eventId },
      data: { statut: 'SUPPRIME' },
      include: {
        createur: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        dossier: { select: { id: true, titre: true, numeroUnique: true } },
      },
    });

    return { message: 'Événement supprimé (soft delete)', event: deleted };
  }

  async assignDossier(id: string, nouveauResponsableId: string) {
    // Vérifier que le dossier existe et n'est pas supprimé
    const dossier = await this.prisma.dossier.findUnique({
      where: { id, statut: { not: 'SUPPRIME' } },
    });
    if (!dossier) {
      this.logger.warn(
        `❌ Tentative de réassignation d'un dossier inexistant: ${id}`,
      );
      throw new NotFoundException(`Dossier avec ID ${id} introuvable`);
    }

    // Vérifier que le nouvel utilisateur existe et est actif
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: nouveauResponsableId, statut: 'ACTIF' },
    });
    if (!utilisateur) {
      this.logger.warn(
        `❌ Utilisateur ${nouveauResponsableId} introuvable ou inactif`,
      );
      throw new NotFoundException(
        `Utilisateur avec ID ${nouveauResponsableId} introuvable ou inactif`,
      );
    }

    // Mettre à jour le responsable
    const updatedDossier = await this.prisma.dossier.update({
      where: { id },
      data: { responsableId: nouveauResponsableId },
      include: {
        client: true,
        responsable: true,
        contentieux: true,
        contrat: true,
        documents: true,
        evenements: true,
        factures: true,
        immobilier: true,
        messages: true,
        sinistreCorporel: true,
        sinistreMateriel: true,
        sinistreMortel: true,
        sport: true,
        taches: true,
        notes: true,
      },
    });

    this.logger.log(
      `✅ Dossier ${id} réassigné à l'utilisateur ${nouveauResponsableId}`,
    );

    return {
      message: `Dossier réassigné avec succès`,
      dossier: updatedDossier,
    };
  }

  async addDocumentsToDossier(
    dossierId: string,
    files: Express.Multer.File[],
    utilisateurId: string,
  ) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId, statut: { not: 'SUPPRIME' } },
    });
    if (!dossier) {
      throw new NotFoundException(`Dossier ${dossierId} introuvable`);
    }

    // Upload + création en base
    const uploadedDocs = await Promise.all(
      files.map(async (file) => {
        const uploaded = await this.cloudinaryService.uploadFile(file);
        return this.prisma.document.create({
          data: {
            dossierId,
            televersePar: utilisateurId,
            titre: file.originalname,
            type: file.mimetype,
            url: uploaded.secure_url,
            statut: 'ACTIF',
          },
        });
      }),
    );

    this.logger.log(
      `📎 ${uploadedDocs.length} document(s) ajoutés au dossier ${dossierId} par ${utilisateurId}`,
    );

    return {
      message: `${uploadedDocs.length} document(s) ajoutés avec succès`,
      documents: uploadedDocs,
    };
  }

  // src/dossiers/dossiers.service.ts

  /**
   * Suppression en masse (soft delete) de dossiers
   */
  async bulkSoftDelete(dossierIds: string[], utilisateurId?: string) {
    // Vérifier que tous les dossiers existent
    const dossiers = await this.prisma.dossier.findMany({
      where: {
        id: { in: dossierIds },
        statut: { not: 'SUPPRIME' },
      },
    });

    if (dossiers.length !== dossierIds.length) {
      const foundIds = dossiers.map((d) => d.id);
      const missingIds = dossierIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Dossiers introuvables: ${missingIds.join(', ')}`,
      );
    }

    // Mettre à jour le statut de tous les dossiers
    const result = await this.prisma.dossier.updateMany({
      where: {
        id: { in: dossierIds },
        statut: { not: 'SUPPRIME' },
      },
      data: {
        statut: 'SUPPRIME',
      },
    });

    // Journal d'audit pour chaque dossier
    await Promise.all(
      dossiers.map((dossier) =>
        this.prisma.journalAudit.create({
          data: {
            utilisateurId: utilisateurId || 'system',
            action: 'SUPPRESSION_MASSE',
            typeCible: 'DOSSIER',
            cibleId: dossier.id,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            ancienneValeur: dossier as any,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            nouvelleValeur: { statut: 'SUPPRIME' } as any,
          },
        }),
      ),
    );

    this.logger.log(`🗑️ ${result.count} dossiers marqués comme SUPPRIME`);
    return {
      message: `${result.count} dossiers supprimés (soft delete)`,
      count: result.count,
    };
  }

  /**
   * Réassignation en masse de dossiers
   */
  async bulkAssign(
    dossierIds: string[],
    nouveauResponsableId: string,
    utilisateurId?: string,
  ) {
    // Vérifier que le nouvel utilisateur existe et est actif
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: nouveauResponsableId, statut: 'ACTIF' },
    });
    if (!utilisateur) {
      throw new NotFoundException(
        `Utilisateur avec ID ${nouveauResponsableId} introuvable ou inactif`,
      );
    }

    // Vérifier que tous les dossiers existent
    const dossiers = await this.prisma.dossier.findMany({
      where: {
        id: { in: dossierIds },
        statut: { not: 'SUPPRIME' },
      },
    });

    if (dossiers.length !== dossierIds.length) {
      const foundIds = dossiers.map((d) => d.id);
      const missingIds = dossierIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Dossiers introuvables: ${missingIds.join(', ')}`,
      );
    }

    // Mettre à jour le responsable de tous les dossiers
    const result = await this.prisma.dossier.updateMany({
      where: {
        id: { in: dossierIds },
        statut: { not: 'SUPPRIME' },
      },
      data: {
        responsableId: nouveauResponsableId,
      },
    });

    // Journal d'audit pour chaque dossier
    await Promise.all(
      dossiers.map((dossier) =>
        this.prisma.journalAudit.create({
          data: {
            utilisateurId: utilisateurId || 'system',
            action: 'REASSIGNATION_MASSE',
            typeCible: 'DOSSIER',
            cibleId: dossier.id,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            ancienneValeur: { responsableId: dossier.responsableId } as any,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            nouvelleValeur: { responsableId: nouveauResponsableId } as any,
          },
        }),
      ),
    );

    this.logger.log(
      `✅ ${result.count} dossiers réassignés à l'utilisateur ${nouveauResponsableId}`,
    );
    return {
      message: `${result.count} dossiers réassignés avec succès`,
      count: result.count,
    };
  }

  /**
   * Archivage en masse de dossiers
   */
  async bulkArchive(dossierIds: string[], utilisateurId?: string) {
    // Vérifier que tous les dossiers existent
    const dossiers = await this.prisma.dossier.findMany({
      where: {
        id: { in: dossierIds },
        statut: { not: 'SUPPRIME' },
      },
    });

    if (dossiers.length !== dossierIds.length) {
      const foundIds = dossiers.map((d) => d.id);
      const missingIds = dossierIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Dossiers introuvables: ${missingIds.join(', ')}`,
      );
    }

    // Mettre à jour le statut de tous les dossiers
    const result = await this.prisma.dossier.updateMany({
      where: {
        id: { in: dossierIds },
        statut: { not: 'SUPPRIME' },
      },
      data: {
        statut: 'ARCHIVE',
      },
    });

    // Journal d'audit pour chaque dossier
    await Promise.all(
      dossiers.map((dossier) =>
        this.prisma.journalAudit.create({
          data: {
            utilisateurId: utilisateurId || 'system',
            action: 'ARCHIVAGE_MASSE',
            typeCible: 'DOSSIER',
            cibleId: dossier.id,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            ancienneValeur: { statut: dossier.statut } as any,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            nouvelleValeur: { statut: 'ARCHIVE' } as any,
          },
        }),
      ),
    );

    this.logger.log(`📁 ${result.count} dossiers archivés`);
    return {
      message: `${result.count} dossiers archivés avec succès`,
      count: result.count,
    };
  }

  /**
   * Export des dossiers au format Excel ou PDF
   */
  async exportDossiers(
    filters: FilterDossierDto,
    format: 'excel' | 'pdf',
    utilisateurId?: string,
  ) {
    // Récupérer les dossiers selon les filtres (sans pagination pour l'export)
    const { data } = await this.findAll({ ...filters, skip: 0, take: 10000 });
    // Journal d'audit
    await this.prisma.journalAudit.create({
      data: {
        utilisateurId: utilisateurId || 'system',
        action: 'EXPORT',
        typeCible: 'DOSSIER',
        cibleId: 'BULK',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        nouvelleValeur: { format, count: data.length } as any,
      },
    });

    // Générer un nom de fichier unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const filename = `dossiers_${timestamp}_${uuidv4()}.${format}`;

    try {
      let buffer: Buffer;
      if (format === 'excel') {
        buffer = await this.generateExcelBuffer(data);
      } else {
        buffer = await this.generatePDFBuffer(data);
      }

      // Télécharger le fichier sur Cloudinary
      const uploadResult = await this.cloudinaryService.uploadBuffer(
        buffer,
        filename,
        'exports',
      );

      this.logger.log(
        `✅ Fichier ${format} téléchargé sur Cloudinary: ${uploadResult.secure_url}`,
      );
      return {
        message: `Export ${format} généré avec succès`,
        format,
        count: data.length,
        fileUrl: uploadResult.secure_url,
        filename,
        publicId: uploadResult.public_id,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la génération du fichier ${format}:`,
        error,
      );
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(
        `Erreur lors de la génération du fichier ${format}: ${errorMessage}`,
      );
    }
  }

  /**
   * Générer un buffer Excel à partir des données de dossiers
   */
  private async generateExcelBuffer(
    data: DossierWithRelations[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dossiers');

    // Définir les colonnes
    worksheet.columns = [
      { header: 'Numéro', key: 'numeroUnique', width: 20 },
      { header: 'Titre', key: 'titre', width: 30 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Statut', key: 'statut', width: 15 },
      { header: 'Client', key: 'client', width: 25 },
      { header: 'Responsable', key: 'responsable', width: 25 },
      { header: 'Date de création', key: 'creeLe', width: 20 },
    ];

    // Ajouter les données
    const formattedData = data.map((dossier) => ({
      numeroUnique: dossier.numeroUnique,
      titre: dossier.titre,
      type: dossier.type,
      statut: dossier.statut,
      client: dossier.client
        ? `${dossier.client.prenom} ${dossier.client.nom}`
        : '',
      responsable: dossier.responsable
        ? `${dossier.responsable.prenom} ${dossier.responsable.nom}`
        : '',
      creeLe: dossier.creeLe
        ? new Date(dossier.creeLe).toLocaleDateString('fr-FR')
        : '',
    }));

    worksheet.addRows(formattedData);

    // Style du header
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Ajouter un filtre automatique
    worksheet.autoFilter = {
      from: 'A1',
      to: `${worksheet.rowCount}${worksheet.columnCount}`,
    };

    // Retourner le buffer au lieu d'écrire un fichier
    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  /**
   * Générer un buffer PDF à partir des données de dossiers
   */
  private async generatePDFBuffer(
    data: DossierWithRelations[],
  ): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      // Créer le contenu HTML pour le PDF
      const htmlContent = this.generateHTMLForPDF(data);
      await page.setContent(htmlContent);
      // Générer le PDF en buffer
      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });
      // Convertir Uint8Array en Buffer
      return Buffer.from(pdfUint8Array);
    } finally {
      await browser.close();
    }
  }

  /**
   * Générer le contenu HTML pour le PDF (inchangée)
   */
  private generateHTMLForPDF(data: DossierWithRelations[]): string {
    const currentDate = new Date().toLocaleDateString('fr-FR');
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Export des Dossiers</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          h1 {
            color: #2c3e50;
            text-align: center;
          }
          .meta-info {
            text-align: center;
            margin-bottom: 30px;
            color: #7f8c8d;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
          }
        </style>
      </head>
      <body>
        <h1>Liste des Dossiers</h1>
        <div class="meta-info">
          <p>Généré le ${currentDate} | Total: ${data.length} dossiers</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Titre</th>
              <th>Type</th>
              <th>Statut</th>
              <th>Client</th>
              <th>Responsable</th>
              <th>Date de création</th>
            </tr>
          </thead>
          <tbody>
    `;
    // Ajouter les lignes de données
    data.forEach((dossier) => {
      html += `
        <tr>
          <td>${dossier.numeroUnique}</td>
          <td>${dossier.titre}</td>
          <td>${dossier.type}</td>
          <td>${dossier.statut}</td>
          <td>${dossier.client ? `${dossier.client.prenom} ${dossier.client.nom}` : ''}</td>
          <td>${dossier.responsable ? `${dossier.responsable.prenom} ${dossier.responsable.nom}` : ''}</td>
          <td>${dossier.creeLe ? new Date(dossier.creeLe).toLocaleDateString('fr-FR') : ''}</td>
        </tr>
      `;
    });
    html += `
          </tbody>
        </table>
        
        <div class="footer">
          <p>Cabinet Juridique 237 - Système de Gestion</p>
        </div>
      </body>
      </html>
    `;
    return html;
  }

  private async invalidateDossierCache() {
    try {
      const cacheKeysKey = 'dossiers:cache_keys';
      const cacheKeys =
        (await this.cacheManager.get<string[]>(cacheKeysKey)) || [];
      await Promise.all(
        cacheKeys.map((key: string) => this.cacheManager.del(key)),
      );
      await this.cacheManager.del(cacheKeysKey);
      this.logger.log(`Cache invalidé pour ${cacheKeys.length} clés`);
    } catch (error) {
      this.logger.error("Erreur lors de l'invalidation du cache:", error);
    }
  }
}
