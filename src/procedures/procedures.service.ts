/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';
import { CreateEtapeProcedureDto } from './dto/create-etape-procedure.dto';
import { UpdateEtapeProcedureDto } from './dto/update-etape-procedure.dto';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { CreatePieceJustificativeDto } from './dto/create-piece-justificative.dto';
import { UpdatePieceJustificativeDto } from './dto/update-piece-justificative.dto';
import {
  ProcedureResponse,
  EtapeProcedureResponse,
  AudienceResponse,
  PieceJustificativeResponse,
  ProcedureStatsResponse,
} from './interfaces/procedure-response.interface';
import {
  StatutProcedure,
  StatutEtape,
  StatutAudience,
  StatutPiece,
} from '@prisma/client';
import { PaginationUtil } from '../common/utils/pagination.util';
import { QueryProceduresDto } from './dto/query-procedures.dto';
import { QueryAudiencesDto } from './dto/query-audiences.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EvenementsService } from '@/evenement-calendrier/evenement-calendrier.service';

@Injectable()
export class ProceduresService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => EvenementsService))
    private evenementsService: EvenementsService,
  ) {}

  // -------------------- GESTION DES PROCÉDURES --------------------
  async createProcedure(
    createProcedureDto: CreateProcedureDto,
  ): Promise<ProcedureResponse> {
    const {
      dossierId,
      typeProcedure,
      juridiction,
      numeroRG,
      dateIntroduction,
      montantReclame,
      etapeActuelle,
      statut,
    } = createProcedureDto;

    // Vérifier si le dossier existe
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
    });

    if (!dossier) {
      throw new NotFoundException(`Dossier avec l'ID ${dossierId} non trouvé`);
    }

    // Créer la procédure
    const procedure = await this.prisma.procedure.create({
      data: {
        dossierId,
        typeProcedure,
        juridiction,
        numeroRG,
        dateIntroduction: new Date(dateIntroduction),
        montantReclame: montantReclame ? parseFloat(montantReclame) : null,
        etapeActuelle: etapeActuelle || 'Introduction',
        statut: statut || StatutProcedure.EN_COURS,
      },
      include: {
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            type: true,
            statut: true,
          },
        },
        etapes: true,
        audiences: true,
        pieces: true,
      },
    });

    // Invalider le cache
    await this.invalidateProceduresCache();

    return this.formatProcedureResponse(procedure);
  }

  async findAllProcedures(query: QueryProceduresDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'creeLe',
      sortOrder = 'desc',
      dossierId,
      typeProcedure,
      juridiction,
      statut,
      search,
      dateIntroductionMin,
      dateIntroductionMax,
      avecAudiencesAVenir,
      avecEcheancesProches,
    } = query;

    // Clé de cache pour cette requête
    const cacheKey = `procedures:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Construire les filtres
    const where: any = {};

    if (dossierId) {
      where.dossierId = dossierId;
    }

    if (typeProcedure) {
      where.typeProcedure = typeProcedure;
    }

    if (juridiction) {
      where.juridiction = { contains: juridiction, mode: 'insensitive' };
    }

    if (statut) {
      where.statut = statut;
    }

    if (search) {
      where.OR = [
        { numeroRG: { contains: search, mode: 'insensitive' } },
        { etapeActuelle: { contains: search, mode: 'insensitive' } },
        { dossier: { titre: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (dateIntroductionMin || dateIntroductionMax) {
      where.dateIntroduction = {};
      if (dateIntroductionMin) {
        where.dateIntroduction.gte = dateIntroductionMin;
      }
      if (dateIntroductionMax) {
        where.dateIntroduction.lte = dateIntroductionMax;
      }
    }

    // Filtrer par procédures avec des audiences à venir
    if (avecAudiencesAVenir) {
      where.audiences = {
        some: {
          dateAudience: {
            gte: new Date(),
          },
          statut: StatutAudience.PREVUE,
        },
      };
    }

    // Filtrer par procédures avec des échéances proches (dans les 7 jours)
    if (avecEcheancesProches) {
      const dateDans7Jours = new Date();
      dateDans7Jours.setDate(dateDans7Jours.getDate() + 7);

      where.etapes = {
        some: {
          dateFin: {
            lte: dateDans7Jours,
            gte: new Date(),
          },
          statut: {
            not: StatutEtape.TERMINEE,
          },
        },
      };
    }

    // Obtenir les paramètres de pagination
    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Exécuter la requête
    const [procedures, total] = await Promise.all([
      this.prisma.procedure.findMany({
        where,
        ...paginationParams,
        include: {
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
              type: true,
              statut: true,
            },
          },
          etapes: {
            orderBy: { dateDebut: 'asc' },
          },
          audiences: {
            orderBy: { dateAudience: 'asc' },
          },
          pieces: {
            orderBy: { dateDepot: 'desc' },
          },
        },
      }),
      this.prisma.procedure.count({ where }),
    ]);

    // Formater les procédures
    const formattedProcedures = await Promise.all(
      procedures.map((procedure) => this.formatProcedureResponse(procedure)),
    );

    // Formater la réponse
    const result = PaginationUtil.createPaginationResult(
      formattedProcedures,
      total,
      {
        page,
        limit,
        sortBy,
        sortOrder,
      },
    );

    // Mettre en cache pour 2 minutes
    await this.cacheManager.set(cacheKey, result, 120);

    return result;
  }

  async findOneProcedure(id: string): Promise<ProcedureResponse> {
    const cacheKey = `procedure:${id}`;
    const cachedProcedure = await this.cacheManager.get(cacheKey);

    if (cachedProcedure) {
      return cachedProcedure as ProcedureResponse;
    }

    const procedure = await this.prisma.procedure.findUnique({
      where: { id },
      include: {
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            type: true,
            statut: true,
          },
        },
        etapes: {
          orderBy: { dateDebut: 'asc' },
          include: {
            responsable: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                role: true,
              },
            },
          },
        },
        audiences: {
          orderBy: { dateAudience: 'asc' },
        },
        pieces: {
          orderBy: { dateDepot: 'desc' },
        },
      },
    });

    if (!procedure) {
      throw new NotFoundException(`Procédure avec l'ID ${id} non trouvée`);
    }

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, procedure, 300);

    return this.formatProcedureResponse(procedure);
  }

  async updateProcedure(
    id: string,
    updateProcedureDto: UpdateProcedureDto,
  ): Promise<ProcedureResponse> {
    // Vérifier si la procédure existe
    const existingProcedure = await this.prisma.procedure.findUnique({
      where: { id },
    });

    if (!existingProcedure) {
      throw new NotFoundException(`Procédure avec l'ID ${id} non trouvée`);
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (updateProcedureDto.typeProcedure !== undefined) {
      updateData.typeProcedure = updateProcedureDto.typeProcedure;
    }
    if (updateProcedureDto.juridiction !== undefined) {
      updateData.juridiction = updateProcedureDto.juridiction;
    }
    if (updateProcedureDto.numeroRG !== undefined) {
      updateData.numeroRG = updateProcedureDto.numeroRG;
    }
    if (updateProcedureDto.dateIntroduction !== undefined) {
      updateData.dateIntroduction = new Date(
        updateProcedureDto.dateIntroduction,
      );
    }
    if (updateProcedureDto.montantReclame !== undefined) {
      updateData.montantReclame = parseFloat(updateProcedureDto.montantReclame);
    }
    if (updateProcedureDto.etapeActuelle !== undefined) {
      updateData.etapeActuelle = updateProcedureDto.etapeActuelle;
    }
    if (updateProcedureDto.statut !== undefined) {
      updateData.statut = updateProcedureDto.statut;
    }

    // Mettre à jour la procédure
    const updatedProcedure = await this.prisma.procedure.update({
      where: { id },
      data: updateData,
      include: {
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            type: true,
            statut: true,
          },
        },
        etapes: {
          orderBy: { dateDebut: 'asc' },
          include: {
            responsable: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                role: true,
              },
            },
          },
        },
        audiences: {
          orderBy: { dateAudience: 'asc' },
        },
        pieces: {
          orderBy: { dateDepot: 'desc' },
        },
      },
    });

    // Invalider les caches
    await this.cacheManager.del(`procedure:${id}`);
    await this.invalidateProceduresCache();

    return this.formatProcedureResponse(updatedProcedure);
  }

  async removeProcedure(id: string): Promise<void> {
    // Vérifier si la procédure existe
    const existingProcedure = await this.prisma.procedure.findUnique({
      where: { id },
    });

    if (!existingProcedure) {
      throw new NotFoundException(`Procédure avec l'ID ${id} non trouvée`);
    }

    // Supprimer la procédure
    await this.prisma.procedure.delete({
      where: { id },
    });

    // Invalider les caches
    await this.cacheManager.del(`procedure:${id}`);
    await this.invalidateProceduresCache();
  }

  // -------------------- GESTION DES ÉTAPES DE PROCÉDURE --------------------
  async createEtapeProcedure(
    createEtapeProcedureDto: CreateEtapeProcedureDto,
  ): Promise<EtapeProcedureResponse> {
    const {
      procedureId,
      nom,
      description,
      dateDebut,
      dateFin,
      delaiLegal,
      statut,
      responsableId,
    } = createEtapeProcedureDto;

    // Vérifier si la procédure existe
    const procedure = await this.prisma.procedure.findUnique({
      where: { id: procedureId },
    });

    if (!procedure) {
      throw new NotFoundException(
        `Procédure avec l'ID ${procedureId} non trouvée`,
      );
    }

    // Vérifier si le responsable existe (si spécifié)
    if (responsableId) {
      const responsable = await this.prisma.utilisateur.findUnique({
        where: { id: responsableId },
      });

      if (!responsable) {
        throw new NotFoundException(
          `Utilisateur avec l'ID ${responsableId} non trouvé`,
        );
      }
    }

    // Créer l'étape de procédure
    const etape = await this.prisma.etapeProcedure.create({
      data: {
        procedureId,
        nom,
        description,
        dateDebut: new Date(dateDebut),
        dateFin: dateFin ? new Date(dateFin) : null,
        delaiLegal,
        statut: statut || StatutEtape.EN_COURS,
        responsableId,
      },
      include: {
        procedure: {
          select: {
            id: true,
            typeProcedure: true,
            juridiction: true,
            numeroRG: true,
          },
        },
        responsable: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
      },
    });

    // Mettre à jour l'étape actuelle de la procédure si nécessaire
    if (etape.statut === StatutEtape.EN_COURS) {
      await this.prisma.procedure.update({
        where: { id: procedureId },
        data: { etapeActuelle: nom },
      });
    }

    // Invalider les caches
    await this.cacheManager.del(`procedure:${procedureId}`);
    await this.invalidateProceduresCache();

    return this.formatEtapeProcedureResponse(etape);
  }

  async findAllEtapesProcedure(procedureId?: string) {
    const where: any = {};
    if (procedureId) {
      where.procedureId = procedureId;
    }

    const etapes = await this.prisma.etapeProcedure.findMany({
      where,
      orderBy: { dateDebut: 'asc' },
      include: {
        procedure: {
          select: {
            id: true,
            typeProcedure: true,
            juridiction: true,
            numeroRG: true,
          },
        },
        responsable: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
      },
    });

    return Promise.all(
      etapes.map((etape) => this.formatEtapeProcedureResponse(etape)),
    );
  }

  async findOneEtapeProcedure(id: string): Promise<EtapeProcedureResponse> {
    const etape = await this.prisma.etapeProcedure.findUnique({
      where: { id },
      include: {
        procedure: {
          select: {
            id: true,
            typeProcedure: true,
            juridiction: true,
            numeroRG: true,
          },
        },
        responsable: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
      },
    });

    if (!etape) {
      throw new NotFoundException(
        `Étape de procédure avec l'ID ${id} non trouvée`,
      );
    }

    return this.formatEtapeProcedureResponse(etape);
  }

  async updateEtapeProcedure(
    id: string,
    updateEtapeProcedureDto: UpdateEtapeProcedureDto,
  ): Promise<EtapeProcedureResponse> {
    // Vérifier si l'étape de procédure existe
    const existingEtape = await this.prisma.etapeProcedure.findUnique({
      where: { id },
      include: {
        procedure: true,
      },
    });

    if (!existingEtape) {
      throw new NotFoundException(
        `Étape de procédure avec l'ID ${id} non trouvée`,
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (updateEtapeProcedureDto.nom !== undefined) {
      updateData.nom = updateEtapeProcedureDto.nom;
    }
    if (updateEtapeProcedureDto.description !== undefined) {
      updateData.description = updateEtapeProcedureDto.description;
    }
    if (updateEtapeProcedureDto.dateDebut !== undefined) {
      updateData.dateDebut = new Date(updateEtapeProcedureDto.dateDebut);
    }
    if (updateEtapeProcedureDto.dateFin !== undefined) {
      updateData.dateFin = updateEtapeProcedureDto.dateFin
        ? new Date(updateEtapeProcedureDto.dateFin)
        : null;
    }
    if (updateEtapeProcedureDto.delaiLegal !== undefined) {
      updateData.delaiLegal = updateEtapeProcedureDto.delaiLegal;
    }
    if (updateEtapeProcedureDto.statut !== undefined) {
      updateData.statut = updateEtapeProcedureDto.statut;
    }
    if (updateEtapeProcedureDto.responsableId !== undefined) {
      updateData.responsableId = updateEtapeProcedureDto.responsableId;
    }

    // Mettre à jour l'étape de procédure
    const updatedEtape = await this.prisma.etapeProcedure.update({
      where: { id },
      data: updateData,
      include: {
        procedure: {
          select: {
            id: true,
            typeProcedure: true,
            juridiction: true,
            numeroRG: true,
          },
        },
        responsable: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
      },
    });

    // Mettre à jour l'étape actuelle de la procédure si nécessaire
    if (updatedEtape.statut === StatutEtape.EN_COURS) {
      await this.prisma.procedure.update({
        where: { id: updatedEtape.procedureId },
        data: { etapeActuelle: updatedEtape.nom },
      });
    }

    // Invalider les caches
    await this.cacheManager.del(`procedure:${updatedEtape.procedureId}`);
    await this.invalidateProceduresCache();

    return this.formatEtapeProcedureResponse(updatedEtape);
  }

  async removeEtapeProcedure(id: string): Promise<void> {
    // Vérifier si l'étape de procédure existe
    const existingEtape = await this.prisma.etapeProcedure.findUnique({
      where: { id },
    });

    if (!existingEtape) {
      throw new NotFoundException(
        `Étape de procédure avec l'ID ${id} non trouvée`,
      );
    }

    // Supprimer l'étape de procédure
    await this.prisma.etapeProcedure.delete({
      where: { id },
    });

    // Invalider les caches
    await this.cacheManager.del(`procedure:${existingEtape.procedureId}`);
    await this.invalidateProceduresCache();
  }

  // -------------------- GESTION DES AUDIENCES --------------------
  async createAudience(
    createAudienceDto: CreateAudienceDto,
  ): Promise<AudienceResponse> {
    const {
      procedureId,
      dateAudience,
      heureAudience,
      salle,
      objet,
      avocat,
      resultat,
      prochaineDate,
      statut,
    } = createAudienceDto;

    // Vérifier si la procédure existe
    const procedure = await this.prisma.procedure.findUnique({
      where: { id: procedureId },
      include: {
        dossier: true,
      },
    });

    if (!procedure) {
      throw new NotFoundException(
        `Procédure avec l'ID ${procedureId} non trouvée`,
      );
    }

    // Créer l'audience
    const audience = await this.prisma.audience.create({
      data: {
        procedureId,
        dateAudience: new Date(dateAudience),
        heureAudience,
        salle,
        objet,
        avocat,
        resultat,
        prochaineDate: prochaineDate ? new Date(prochaineDate) : null,
        statut: statut || StatutAudience.PREVUE,
      },
      include: {
        procedure: {
          include: {
            dossier: {
              select: {
                id: true,
                numeroUnique: true,
                titre: true,
              },
            },
          },
        },
      },
    });

    // Créer un événement dans le calendrier pour l'audience
    const dateAudienceObj = new Date(dateAudience);
    const [heure, minute] = heureAudience.split(':');
    dateAudienceObj.setHours(parseInt(heure, 10), parseInt(minute, 10), 0, 0);

    const finAudience = new Date(dateAudienceObj);
    finAudience.setHours(finAudience.getHours() + 2); // Durée par défaut de 2 heures

    try {
      await this.evenementsService.create(
        {
          dossierId: procedure.dossierId,
          titre: `Audience: ${objet}`,
          description: `Audience pour la procédure ${procedure.numeroRG || procedure.typeProcedure} à ${procedure.juridiction}`,
          debut: dateAudienceObj, // Objet Date, pas une chaîne
          fin: finAudience, // Objet Date, pas une chaîne
        },
        procedure.dossier.responsableId || '',
      );
    } catch (error) {
      console.error(
        "Erreur lors de la création de l'événement pour l'audience:",
        error,
      );
    }

    // Envoyer une notification pour l'audience
    try {
      await this.notificationsService.create({
        utilisateurId: procedure.dossier.responsableId || '',
        titre: 'Nouvelle audience programmée',
        message: `Une audience a été programmée pour le ${dateAudienceObj.toLocaleDateString('fr-FR')} à ${heureAudience}`,
        type: 'AUDIENCE',
        lien: `/procedures/${procedureId}/audiences/${audience.id}`,
      });
    } catch (error) {
      console.error(
        "Erreur lors de l'envoi de la notification pour l'audience:",
        error,
      );
    }

    // Invalider les caches
    await this.cacheManager.del(`procedure:${procedureId}`);
    await this.invalidateProceduresCache();

    return this.formatAudienceResponse(audience);
  }

  async findAllAudiences(query: QueryAudiencesDto) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'dateAudience',
      sortOrder = 'asc',
      procedureId,
      statut,
      dateAudienceMin,
      dateAudienceMax,
      search,
      aVenirSeulement,
      cetteSemaineSeulement,
    } = query;

    // Clé de cache pour cette requête
    const cacheKey = `audiences:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Construire les filtres
    const where: any = {};

    if (procedureId) {
      where.procedureId = procedureId;
    }

    if (statut) {
      where.statut = statut;
    }

    if (dateAudienceMin || dateAudienceMax) {
      where.dateAudience = {};
      if (dateAudienceMin) {
        where.dateAudience.gte = dateAudienceMin;
      }
      if (dateAudienceMax) {
        where.dateAudience.lte = dateAudienceMax;
      }
    }

    if (search) {
      where.OR = [
        { objet: { contains: search, mode: 'insensitive' } },
        { salle: { contains: search, mode: 'insensitive' } },
        { avocat: { contains: search, mode: 'insensitive' } },
        { procedure: { numeroRG: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Filtrer par audiences à venir
    if (aVenirSeulement) {
      where.dateAudience = {
        gte: new Date(),
      };
      where.statut = StatutAudience.PREVUE;
    }

    // Filtrer par audiences de la semaine
    if (cetteSemaineSeulement) {
      const debutSemaine = new Date();
      debutSemaine.setDate(debutSemaine.getDate() - debutSemaine.getDay());
      debutSemaine.setHours(0, 0, 0, 0);

      const finSemaine = new Date(debutSemaine);
      finSemaine.setDate(finSemaine.getDate() + 6);
      finSemaine.setHours(23, 59, 59, 999);

      where.dateAudience = {
        gte: debutSemaine,
        lte: finSemaine,
      };
    }

    // Obtenir les paramètres de pagination
    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Exécuter la requête
    const [audiences, total] = await Promise.all([
      this.prisma.audience.findMany({
        where,
        ...paginationParams,
        include: {
          procedure: {
            include: {
              dossier: {
                select: {
                  id: true,
                  numeroUnique: true,
                  titre: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.audience.count({ where }),
    ]);

    // Formater les audiences
    const formattedAudiences = await Promise.all(
      audiences.map((audience) => this.formatAudienceResponse(audience)),
    );

    // Formater la réponse
    const result = PaginationUtil.createPaginationResult(
      formattedAudiences,
      total,
      {
        page,
        limit,
        sortBy,
        sortOrder,
      },
    );

    // Mettre en cache pour 1 minute
    await this.cacheManager.set(cacheKey, result, 60);

    return result;
  }

  async findOneAudience(id: string): Promise<AudienceResponse> {
    const cacheKey = `audience:${id}`;
    const cachedAudience = await this.cacheManager.get(cacheKey);

    if (cachedAudience) {
      return cachedAudience as AudienceResponse;
    }

    const audience = await this.prisma.audience.findUnique({
      where: { id },
      include: {
        procedure: {
          include: {
            dossier: {
              select: {
                id: true,
                numeroUnique: true,
                titre: true,
              },
            },
          },
        },
      },
    });

    if (!audience) {
      throw new NotFoundException(`Audience avec l'ID ${id} non trouvée`);
    }

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, audience, 300);

    return this.formatAudienceResponse(audience);
  }

  async updateAudience(
    id: string,
    updateAudienceDto: UpdateAudienceDto,
  ): Promise<AudienceResponse> {
    // Vérifier si l'audience existe
    const existingAudience = await this.prisma.audience.findUnique({
      where: { id },
      include: {
        procedure: {
          include: {
            dossier: true,
          },
        },
      },
    });

    if (!existingAudience) {
      throw new NotFoundException(`Audience avec l'ID ${id} non trouvée`);
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (updateAudienceDto.dateAudience !== undefined) {
      updateData.dateAudience = new Date(updateAudienceDto.dateAudience);
    }
    if (updateAudienceDto.heureAudience !== undefined) {
      updateData.heureAudience = updateAudienceDto.heureAudience;
    }
    if (updateAudienceDto.salle !== undefined) {
      updateData.salle = updateAudienceDto.salle;
    }
    if (updateAudienceDto.objet !== undefined) {
      updateData.objet = updateAudienceDto.objet;
    }
    if (updateAudienceDto.avocat !== undefined) {
      updateData.avocat = updateAudienceDto.avocat;
    }
    if (updateAudienceDto.resultat !== undefined) {
      updateData.resultat = updateAudienceDto.resultat;
    }
    if (updateAudienceDto.prochaineDate !== undefined) {
      updateData.prochaineDate = updateAudienceDto.prochaineDate
        ? new Date(updateAudienceDto.prochaineDate)
        : null;
    }
    if (updateAudienceDto.statut !== undefined) {
      updateData.statut = updateAudienceDto.statut;
    }

    // Mettre à jour l'audience
    const updatedAudience = await this.prisma.audience.update({
      where: { id },
      data: updateData,
      include: {
        procedure: {
          include: {
            dossier: {
              select: {
                id: true,
                numeroUnique: true,
                titre: true,
              },
            },
          },
        },
      },
    });

    // Mettre à jour l'événement dans le calendrier si la date ou l'heure a changé
    if (
      updateData.dateAudience ||
      updateData.heureAudience ||
      updateData.objet ||
      updateData.statut
    ) {
      try {
        // Chercher l'événement correspondant à cette audience
        const dateAudienceObj = new Date(
          updateData.dateAudience || existingAudience.dateAudience,
        );
        const [heure, minute] = (
          updateData.heureAudience || existingAudience.heureAudience
        ).split(':');
        dateAudienceObj.setHours(
          parseInt(heure, 10),
          parseInt(minute, 10),
          0,
          0,
        );

        const finAudience = new Date(dateAudienceObj);
        finAudience.setHours(finAudience.getHours() + 2);

        // Mettre à jour l'événement
        await this.evenementsService.updateEvenementByProcedureAndDate(
          existingAudience.procedureId,
          existingAudience.dateAudience,
          {
            titre: updateData.objet || `Audience: ${existingAudience.objet}`,
            description: `Audience pour la procédure ${existingAudience.procedure.numeroRG || existingAudience.procedure.typeProcedure} à ${existingAudience.procedure.juridiction}`,
            debut: dateAudienceObj,
            fin: finAudience,
            statut:
              updateData.statut === StatutAudience.TENUE ? 'TERMINE' : 'PREVU',
          },
        );
      } catch (error) {
        console.error(
          "Erreur lors de la mise à jour de l'événement pour l'audience:",
          error,
        );
      }
    }

    // Invalider les caches
    await this.cacheManager.del(`audience:${id}`);
    await this.cacheManager.del(`procedure:${existingAudience.procedureId}`);
    await this.invalidateProceduresCache();

    return this.formatAudienceResponse(updatedAudience);
  }

  async removeAudience(id: string): Promise<void> {
    // Vérifier si l'audience existe
    const existingAudience = await this.prisma.audience.findUnique({
      where: { id },
    });

    if (!existingAudience) {
      throw new NotFoundException(`Audience avec l'ID ${id} non trouvée`);
    }

    // Supprimer l'audience
    await this.prisma.audience.delete({
      where: { id },
    });

    // Supprimer l'événement correspondant dans le calendrier
    try {
      await this.evenementsService.removeEvenementByProcedureAndDate(
        existingAudience.procedureId,
        existingAudience.dateAudience,
      );
    } catch (error) {
      console.error(
        "Erreur lors de la suppression de l'événement pour l'audience:",
        error,
      );
    }

    // Invalider les caches
    await this.cacheManager.del(`audience:${id}`);
    await this.cacheManager.del(`procedure:${existingAudience.procedureId}`);
    await this.invalidateProceduresCache();
  }

  // -------------------- GESTION DES PIÈCES JUSTIFICATIVES --------------------
  async createPieceJustificative(
    createPieceJustificativeDto: CreatePieceJustificativeDto,
  ): Promise<PieceJustificativeResponse> {
    const {
      procedureId,
      nom,
      type,
      dateDepot,
      numeroDepot,
      documentUrl,
      statut,
    } = createPieceJustificativeDto;

    // Vérifier si la procédure existe
    const procedure = await this.prisma.procedure.findUnique({
      where: { id: procedureId },
      include: {
        dossier: true,
      },
    });

    if (!procedure) {
      throw new NotFoundException(
        `Procédure avec l'ID ${procedureId} non trouvée`,
      );
    }

    // Créer la pièce justificative
    const piece = await this.prisma.pieceJustificative.create({
      data: {
        procedureId,
        nom,
        type,
        dateDepot: new Date(dateDepot),
        numeroDepot,
        documentUrl,
        statut: statut || StatutPiece.DEPOSEE,
      },
      include: {
        procedure: {
          include: {
            dossier: {
              select: {
                id: true,
                numeroUnique: true,
                titre: true,
              },
            },
          },
        },
      },
    });

    // Invalider les caches
    await this.cacheManager.del(`procedure:${procedureId}`);
    await this.invalidateProceduresCache();

    return this.formatPieceJustificativeResponse(piece);
  }

  async findAllPiecesJustificatives(procedureId?: string) {
    const where: any = {};
    if (procedureId) {
      where.procedureId = procedureId;
    }

    const pieces = await this.prisma.pieceJustificative.findMany({
      where,
      orderBy: { dateDepot: 'desc' },
      include: {
        procedure: {
          include: {
            dossier: {
              select: {
                id: true,
                numeroUnique: true,
                titre: true,
              },
            },
          },
        },
      },
    });

    return Promise.all(
      pieces.map((piece) => this.formatPieceJustificativeResponse(piece)),
    );
  }

  async findOnePieceJustificative(
    id: string,
  ): Promise<PieceJustificativeResponse> {
    const piece = await this.prisma.pieceJustificative.findUnique({
      where: { id },
      include: {
        procedure: {
          include: {
            dossier: {
              select: {
                id: true,
                numeroUnique: true,
                titre: true,
              },
            },
          },
        },
      },
    });

    if (!piece) {
      throw new NotFoundException(
        `Pièce justificative avec l'ID ${id} non trouvée`,
      );
    }

    return this.formatPieceJustificativeResponse(piece);
  }

  async updatePieceJustificative(
    id: string,
    updatePieceJustificativeDto: UpdatePieceJustificativeDto,
  ): Promise<PieceJustificativeResponse> {
    // Vérifier si la pièce justificative existe
    const existingPiece = await this.prisma.pieceJustificative.findUnique({
      where: { id },
    });

    if (!existingPiece) {
      throw new NotFoundException(
        `Pièce justificative avec l'ID ${id} non trouvée`,
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (updatePieceJustificativeDto.nom !== undefined) {
      updateData.nom = updatePieceJustificativeDto.nom;
    }
    if (updatePieceJustificativeDto.type !== undefined) {
      updateData.type = updatePieceJustificativeDto.type;
    }
    if (updatePieceJustificativeDto.dateDepot !== undefined) {
      updateData.dateDepot = new Date(updatePieceJustificativeDto.dateDepot);
    }
    if (updatePieceJustificativeDto.numeroDepot !== undefined) {
      updateData.numeroDepot = updatePieceJustificativeDto.numeroDepot;
    }
    if (updatePieceJustificativeDto.documentUrl !== undefined) {
      updateData.documentUrl = updatePieceJustificativeDto.documentUrl;
    }
    if (updatePieceJustificativeDto.statut !== undefined) {
      updateData.statut = updatePieceJustificativeDto.statut;
    }

    // Mettre à jour la pièce justificative
    const updatedPiece = await this.prisma.pieceJustificative.update({
      where: { id },
      data: updateData,
      include: {
        procedure: {
          include: {
            dossier: {
              select: {
                id: true,
                numeroUnique: true,
                titre: true,
              },
            },
          },
        },
      },
    });

    // Invalider les caches
    await this.cacheManager.del(`piece:${id}`);
    await this.cacheManager.del(`procedure:${updatedPiece.procedureId}`);
    await this.invalidateProceduresCache();

    return this.formatPieceJustificativeResponse(updatedPiece);
  }

  async removePieceJustificative(id: string): Promise<void> {
    // Vérifier si la pièce justificative existe
    const existingPiece = await this.prisma.pieceJustificative.findUnique({
      where: { id },
    });

    if (!existingPiece) {
      throw new NotFoundException(
        `Pièce justificative avec l'ID ${id} non trouvée`,
      );
    }

    // Supprimer la pièce justificative
    await this.prisma.pieceJustificative.delete({
      where: { id },
    });

    // Invalider les caches
    await this.cacheManager.del(`piece:${id}`);
    await this.cacheManager.del(`procedure:${existingPiece.procedureId}`);
    await this.invalidateProceduresCache();
  }

  // -------------------- CALCUL DES DÉLAIS ET ALERTES --------------------
  async calculateDelaisProcedure(procedureId: string): Promise<{
    delaisEches: Array<{
      id: string;
      nom: string;
      dateEcheance: Date;
      joursRestants: number;
      estEnRetard: boolean;
      priorite: string;
    }>;
  }> {
    // Vérifier si la procédure existe
    const procedure = await this.prisma.procedure.findUnique({
      where: { id: procedureId },
      include: {
        etapes: {
          where: {
            statut: {
              not: StatutEtape.TERMINEE,
            },
          },
        },
      },
    });

    if (!procedure) {
      throw new NotFoundException(
        `Procédure avec l'ID ${procedureId} non trouvée`,
      );
    }

    // Calculer les délais pour chaque étape
    const delaisEches = procedure.etapes.map((etape) => {
      const dateEcheance = etape.dateFin || new Date(etape.dateDebut);
      if (etape.delaiLegal) {
        dateEcheance.setDate(dateEcheance.getDate() + etape.delaiLegal);
      }

      const joursRestants = Math.ceil(
        (dateEcheance.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      );

      let priorite = 'BASSE';
      if (joursRestants < 0) {
        priorite = 'CRITIQUE';
      } else if (joursRestants <= 3) {
        priorite = 'HAUTE';
      } else if (joursRestants <= 7) {
        priorite = 'MOYENNE';
      }

      return {
        id: etape.id,
        nom: etape.nom,
        dateEcheance,
        joursRestants,
        estEnRetard: joursRestants < 0,
        priorite,
      };
    });

    // Trier par date d'échéance
    delaisEches.sort(
      (a, b) => a.dateEcheance.getTime() - b.dateEcheance.getTime(),
    );

    return { delaisEches };
  }

  async getEcheancesProches(jours: number = 7): Promise<{
    echeances: Array<{
      id: string;
      nom: string;
      dateEcheance: Date;
      joursRestants: number;
      priorite: string;
      procedureId: string;
      procedureNom: string;
      dossierId: string;
      dossierNumero: string;
    }>;
  }> {
    // Date limite
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() + jours);

    // Récupérer toutes les étapes non terminées avec une date d'échéance dans les prochains jours
    const etapes = await this.prisma.etapeProcedure.findMany({
      where: {
        statut: {
          not: StatutEtape.TERMINEE,
        },
        OR: [
          {
            dateFin: {
              lte: dateLimite,
              gte: new Date(),
            },
          },
          {
            dateDebut: {
              lte: new Date(),
            },
            delaiLegal: {
              not: null,
            },
          },
        ],
      },
      include: {
        procedure: {
          include: {
            dossier: {
              select: {
                id: true,
                numeroUnique: true,
              },
            },
          },
        },
      },
    });

    // Calculer les délais pour chaque étape
    const echeances = etapes.map((etape) => {
      const dateEcheance = etape.dateFin || new Date(etape.dateDebut);
      if (etape.delaiLegal) {
        const dateAvecDelai = new Date(etape.dateDebut);
        dateAvecDelai.setDate(dateAvecDelai.getDate() + etape.delaiLegal);
        if (!etape.dateFin || dateAvecDelai < dateEcheance) {
          dateEcheance.setTime(dateAvecDelai.getTime());
        }
      }

      const joursRestants = Math.ceil(
        (dateEcheance.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      );

      let priorite = 'BASSE';
      if (joursRestants < 0) {
        priorite = 'CRITIQUE';
      } else if (joursRestants <= 3) {
        priorite = 'HAUTE';
      } else if (joursRestants <= 7) {
        priorite = 'MOYENNE';
      }

      return {
        id: etape.id,
        nom: etape.nom,
        dateEcheance,
        joursRestants,
        priorite,
        procedureId: etape.procedureId,
        procedureNom: `${etape.procedure.typeProcedure} - ${etape.procedure.juridiction}`,
        dossierId: etape.procedure.dossierId,
        dossierNumero: etape.procedure.dossier.numeroUnique,
      };
    });

    // Trier par date d'échéance
    echeances.sort(
      (a, b) => a.dateEcheance.getTime() - b.dateEcheance.getTime(),
    );

    return { echeances };
  }

  async getAudiencesProches(jours: number = 7): Promise<{
    audiences: Array<{
      id: string;
      dateAudience: Date;
      objet: string;
      joursRestants: number;
      procedureId: string;
      procedureNom: string;
      dossierId: string;
      dossierNumero: string;
    }>;
  }> {
    // Date limite
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() + jours);

    // Récupérer toutes les audiences à venir dans les prochains jours
    const audiences = await this.prisma.audience.findMany({
      where: {
        dateAudience: {
          lte: dateLimite,
          gte: new Date(),
        },
        statut: StatutAudience.PREVUE,
      },
      include: {
        procedure: {
          include: {
            dossier: {
              select: {
                id: true,
                numeroUnique: true,
              },
            },
          },
        },
      },
      orderBy: {
        dateAudience: 'asc',
      },
    });

    // Calculer les jours restants pour chaque audience
    const audiencesProches = audiences.map((audience) => {
      const joursRestants = Math.ceil(
        (audience.dateAudience.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return {
        id: audience.id,
        dateAudience: audience.dateAudience,
        objet: audience.objet,
        joursRestants,
        procedureId: audience.procedureId,
        procedureNom: `${audience.procedure.typeProcedure} - ${audience.procedure.juridiction}`,
        dossierId: audience.procedure.dossierId,
        dossierNumero: audience.procedure.dossier.numeroUnique,
      };
    });

    return { audiences: audiencesProches };
  }

  // -------------------- STATISTIQUES --------------------
  async getStats(): Promise<ProcedureStatsResponse> {
    const cacheKey = 'procedures-stats';
    const cachedStats = await this.cacheManager.get(cacheKey);

    if (cachedStats) {
      return cachedStats as ProcedureStatsResponse;
    }

    // Date pour les statistiques
    const aujourdhui = new Date();
    const debutSemaine = new Date(aujourdhui);
    debutSemaine.setDate(debutSemaine.getDate() - debutSemaine.getDay());
    debutSemaine.setHours(0, 0, 0, 0);

    const finSemaine = new Date(debutSemaine);
    finSemaine.setDate(finSemaine.getDate() + 6);
    finSemaine.setHours(23, 59, 59, 999);

    // Récupérer les statistiques
    const [
      totalProcedures,
      proceduresEnCours,
      proceduresTerminees,
      proceduresSuspendues,
      audiencesPrevues,
      audiencesCetteSemaine,
      audiencesEnRetard,
      piecesDeposees,
      piecesEnAttente,
      proceduresParType,
      proceduresParJuridiction,
      proceduresRecentes,
      audiencesProches,
    ] = await Promise.all([
      // Total des procédures
      this.prisma.procedure.count(),
      // Procédures en cours
      this.prisma.procedure.count({
        where: { statut: StatutProcedure.EN_COURS },
      }),
      // Procédures terminées
      this.prisma.procedure.count({
        where: { statut: StatutProcedure.TERMINEE },
      }),
      // Procédures suspendues
      this.prisma.procedure.count({
        where: { statut: StatutProcedure.SUSPENDUE },
      }),
      // Audiences prévues
      this.prisma.audience.count({
        where: {
          dateAudience: {
            gte: new Date(),
          },
          statut: StatutAudience.PREVUE,
        },
      }),
      // Audiences cette semaine
      this.prisma.audience.count({
        where: {
          dateAudience: {
            gte: debutSemaine,
            lte: finSemaine,
          },
          statut: StatutAudience.PREVUE,
        },
      }),
      // Audiences en retard
      this.prisma.audience.count({
        where: {
          dateAudience: {
            lt: new Date(),
          },
          statut: StatutAudience.PREVUE,
        },
      }),
      // Pièces déposées
      this.prisma.pieceJustificative.count({
        where: { statut: StatutPiece.DEPOSEE },
      }),
      // Pièces en attente
      this.prisma.pieceJustificative.count({
        where: { statut: StatutPiece.ENREGISTREE },
      }),
      // Procédures par type
      this.prisma.procedure.groupBy({
        by: ['typeProcedure'],
        _count: {
          id: true,
        },
      }),
      // Procédures par juridiction
      this.prisma.procedure.groupBy({
        by: ['juridiction'],
        _count: {
          id: true,
        },
      }),
      // Procédures récentes
      this.prisma.procedure.findMany({
        orderBy: { creeLe: 'desc' },
        take: 5,
        include: {
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
              type: true,
              statut: true,
            },
          },
          etapes: {
            orderBy: { dateDebut: 'asc' },
          },
          audiences: {
            orderBy: { dateAudience: 'asc' },
          },
          pieces: {
            orderBy: { dateDepot: 'desc' },
          },
        },
      }),
      // Audiences proches
      this.prisma.audience.findMany({
        where: {
          dateAudience: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          statut: StatutAudience.PREVUE,
        },
        orderBy: { dateAudience: 'asc' },
        take: 5,
        include: {
          procedure: {
            include: {
              dossier: {
                select: {
                  id: true,
                  numeroUnique: true,
                  titre: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Calculer le délai moyen de procédure
    const proceduresTermineesAvecDates = await this.prisma.procedure.findMany({
      where: { statut: StatutProcedure.TERMINEE },
      select: {
        creeLe: true,
        etapes: {
          where: { statut: StatutEtape.TERMINEE },
          orderBy: { dateFin: 'desc' },
          take: 1,
          select: { dateFin: true },
        },
      },
    });

    let delaiMoyenProcedure = 0;
    if (proceduresTermineesAvecDates.length > 0) {
      const totalJours = proceduresTermineesAvecDates.reduce(
        (total, procedure) => {
          if (procedure.etapes.length > 0 && procedure.etapes[0].dateFin) {
            return (
              total +
              (procedure.etapes[0].dateFin.getTime() -
                procedure.creeLe.getTime()) /
                (1000 * 60 * 60 * 24)
            );
          }
          return total;
        },
        0,
      );
      delaiMoyenProcedure = totalJours / proceduresTermineesAvecDates.length;
    }

    // Récupérer les échéances proches
    const { echeances } = await this.getEcheancesProches(7);

    // Formater les procédures par type
    const formattedProceduresParType = proceduresParType.map((item) => ({
      type: item.typeProcedure,
      count: item._count.id,
    }));

    // Formater les procédures par juridiction
    const formattedProceduresParJuridiction = proceduresParJuridiction.map(
      (item) => ({
        juridiction: item.juridiction,
        count: item._count.id,
      }),
    );

    // Formater les procédures récentes
    const formattedProceduresRecentes = await Promise.all(
      proceduresRecentes.map((procedure) =>
        this.formatProcedureResponse(procedure),
      ),
    );

    // Formater les audiences proches
    const formattedAudiencesProches = await Promise.all(
      audiencesProches.map((audience) => this.formatAudienceResponse(audience)),
    );

    const stats: ProcedureStatsResponse = {
      totalProcedures,
      proceduresEnCours,
      proceduresTerminees,
      proceduresSuspendues,
      audiencesPrevues,
      audiencesCetteSemaine,
      audiencesEnRetard,
      piecesDeposees,
      piecesEnAttente,
      delaiMoyenProcedure,
      proceduresParType: formattedProceduresParType,
      proceduresParJuridiction: formattedProceduresParJuridiction,
      echeancesProches: echeances.slice(0, 5),
      proceduresRecentes: formattedProceduresRecentes,
      audiencesProches: formattedAudiencesProches,
    };

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300);

    return stats;
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private formatProcedureResponse(procedure: any): ProcedureResponse {
    // Calculer la prochaine échéance
    let prochaineEcheance: Date | undefined;
    let joursRestants: number | undefined;

    if (procedure.etapes && procedure.etapes.length > 0) {
      const etapesNonTerminees = procedure.etapes.filter(
        (etape) => etape.statut !== StatutEtape.TERMINEE,
      );

      if (etapesNonTerminees.length > 0) {
        const etapesAvecEcheance = etapesNonTerminees.map((etape) => {
          const dateEcheance = etape.dateFin || new Date(etape.dateDebut);
          if (etape.delaiLegal) {
            dateEcheance.setDate(dateEcheance.getDate() + etape.delaiLegal);
          }
          return { ...etape, dateEcheance };
        });

        etapesAvecEcheance.sort(
          (a, b) => a.dateEcheance.getTime() - b.dateEcheance.getTime(),
        );
        prochaineEcheance = etapesAvecEcheance[0].dateEcheance;
        // Vérifier si prochaineEcheance est défini avant de calculer joursRestants
        if (prochaineEcheance) {
          joursRestants = Math.ceil(
            (prochaineEcheance.getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          );
        }
      }
    }

    // Calculer le nombre d'étapes terminées
    const nombreEtapesTerminees = procedure.etapes
      ? procedure.etapes.filter(
          (etape) => etape.statut === StatutEtape.TERMINEE,
        ).length
      : 0;
    const nombreEtapes = procedure.etapes ? procedure.etapes.length : 0;
    const pourcentageAvancement =
      nombreEtapes > 0 ? (nombreEtapesTerminees / nombreEtapes) * 100 : 0;

    return {
      id: procedure.id,
      dossierId: procedure.dossierId,
      typeProcedure: procedure.typeProcedure,
      juridiction: procedure.juridiction,
      numeroRG: procedure.numeroRG,
      dateIntroduction: procedure.dateIntroduction,
      montantReclame: procedure.montantReclame
        ? parseFloat(procedure.montantReclame)
        : undefined,
      etapeActuelle: procedure.etapeActuelle,
      statut: procedure.statut,
      creeLe: procedure.creeLe,
      modifieLe: procedure.modifieLe,
      dossier: procedure.dossier,
      etapes: procedure.etapes
        ? procedure.etapes.map((etape) => ({
            id: etape.id,
            nom: etape.nom,
            description: etape.description,
            dateDebut: etape.dateDebut,
            dateFin: etape.dateFin,
            delaiLegal: etape.delaiLegal,
            statut: etape.statut,
            responsable: etape.responsable,
          }))
        : [],
      audiences: procedure.audiences
        ? procedure.audiences.map((audience) => ({
            id: audience.id,
            dateAudience: audience.dateAudience,
            heureAudience: audience.heureAudience,
            salle: audience.salle,
            objet: audience.objet,
            avocat: audience.avocat,
            resultat: audience.resultat,
            prochaineDate: audience.prochaineDate,
            statut: audience.statut,
          }))
        : [],
      pieces: procedure.pieces
        ? procedure.pieces.map((piece) => ({
            id: piece.id,
            nom: piece.nom,
            type: piece.type,
            dateDepot: piece.dateDepot,
            numeroDepot: piece.numeroDepot,
            documentUrl: piece.documentUrl,
            statut: piece.statut,
          }))
        : [],
      prochaineEcheance,
      joursRestants,
      nombreEtapes,
      nombreEtapesTerminees,
      pourcentageAvancement,
    };
  }

  private async formatEtapeProcedureResponse(
    etape: any,
  ): Promise<EtapeProcedureResponse> {
    // Calculer les jours restants
    let joursRestants: number | undefined;
    let estEnRetard = false;

    if (etape.statut !== StatutEtape.TERMINEE) {
      const dateEcheance = etape.dateFin || new Date(etape.dateDebut);
      if (etape.delaiLegal) {
        dateEcheance.setDate(dateEcheance.getDate() + etape.delaiLegal);
      }

      joursRestants = Math.ceil(
        (dateEcheance.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      );
      estEnRetard = joursRestants < 0;
    }

    // Récupérer les documents requis pour cette étape
    const documentsRequis = await this.prisma.pieceJustificative.findMany({
      where: {
        procedureId: etape.procedureId,
        // Note: Dans une implémentation réelle, vous pourriez avoir une relation
        // directe entre les étapes et les pièces requises
      },
      select: {
        id: true,
        nom: true,
        type: true,
        statut: true,
      },
    });

    return {
      id: etape.id,
      procedureId: etape.procedureId,
      nom: etape.nom,
      description: etape.description,
      dateDebut: etape.dateDebut,
      dateFin: etape.dateFin,
      delaiLegal: etape.delaiLegal,
      statut: etape.statut,
      responsable: etape.responsable,
      procedure: etape.procedure,
      joursRestants,
      estEnRetard,
      documentsRequis,
    };
  }

  private formatAudienceResponse(audience: any): AudienceResponse {
    // Calculer les jours restants
    const joursRestants = Math.ceil(
      (audience.dateAudience.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Vérifier si c'est aujourd'hui, demain ou cette semaine
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    const demain = new Date(aujourdhui);
    demain.setDate(demain.getDate() + 1);

    const dateAudience = new Date(audience.dateAudience);
    dateAudience.setHours(0, 0, 0, 0);

    const estAujourdhui = dateAudience.getTime() === aujourdhui.getTime();
    const estDemain = dateAudience.getTime() === demain.getTime();

    const debutSemaine = new Date(aujourdhui);
    debutSemaine.setDate(debutSemaine.getDate() - debutSemaine.getDay());

    const finSemaine = new Date(debutSemaine);
    finSemaine.setDate(finSemaine.getDate() + 6);

    const estCetteSemaine =
      dateAudience >= debutSemaine && dateAudience <= finSemaine;

    return {
      id: audience.id,
      procedureId: audience.procedureId,
      dateAudience: audience.dateAudience,
      heureAudience: audience.heureAudience,
      salle: audience.salle,
      objet: audience.objet,
      avocat: audience.avocat,
      resultat: audience.resultat,
      prochaineDate: audience.prochaineDate,
      statut: audience.statut,
      creeLe: audience.creeLe,
      modifieLe: audience.modifieLe,
      procedure: {
        id: audience.procedure.id,
        typeProcedure: audience.procedure.typeProcedure,
        juridiction: audience.procedure.juridiction,
        numeroRG: audience.procedure.numeroRG,
        dossier: audience.procedure.dossier,
      },
      joursRestants,
      estAujourdhui,
      estDemain,
      estCetteSemaine,
    };
  }

  private formatPieceJustificativeResponse(
    piece: any,
  ): PieceJustificativeResponse {
    // Calculer les jours depuis le dépôt
    const joursDepot = Math.ceil(
      (new Date().getTime() - piece.dateDepot.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Vérifier si c'est récent (moins de 7 jours)
    const estRecent = joursDepot <= 7;

    return {
      id: piece.id,
      procedureId: piece.procedureId,
      nom: piece.nom,
      type: piece.type,
      dateDepot: piece.dateDepot,
      numeroDepot: piece.numeroDepot,
      documentUrl: piece.documentUrl,
      statut: piece.statut,
      creeLe: piece.creeLe,
      modifieLe: piece.modifieLe,
      procedure: {
        id: piece.procedure.id,
        typeProcedure: piece.procedure.typeProcedure,
        juridiction: piece.procedure.juridiction,
        numeroRG: piece.procedure.numeroRG,
        dossier: piece.procedure.dossier,
      },
      joursDepot,
      estRecent,
    };
  }

  private async invalidateProceduresCache(): Promise<void> {
    try {
      // Invalider tous les caches liés aux procédures
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores) &&
        this.cacheManager.stores.length > 0
      ) {
        const store = this.cacheManager.stores[0];

        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('procedures:*');
          const procedureKeys = await store.keys('procedure:*');
          const audienceKeys = await store.keys('audience:*');
          const pieceKeys = await store.keys('piece:*');
          const statsKeys = await store.keys('procedures-stats:*');

          const allKeys = [
            ...keys,
            ...procedureKeys,
            ...audienceKeys,
            ...pieceKeys,
            ...statsKeys,
          ];

          if (
            allKeys.length > 0 &&
            'delete' in store &&
            typeof store.delete === 'function'
          ) {
            await Promise.all(allKeys.map((key) => store.delete(key)));
          }
        }
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'invalidation du cache des procédures:",
        error,
      );
    }
  }
}
