/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/dossiers/dossier.service.ts
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateDossierDto } from './dto/create-dossier.dto';
import { UpdateDossierDto } from './dto/update-dossier.dto';
import { QueryDossierDto } from './dto/query-dossier.dto';
import { DossierResponse } from './interfaces/dossier-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { NumeroUniqueUtil } from '../common/utils/numero-unique.util';
import { NotificationsService } from '../notifications/notifications.service';
import {
  EtapeProcedures,
  CategorieVehicule,
  TypeDossier,
  StatutDossier,
  GraviteBlessure,
  RegimeFoncier,
} from '@prisma/client';

@Injectable()
export class DossiersService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  // -------------------- CRUD DE BASE --------------------
  async create(createDossierDto: CreateDossierDto): Promise<DossierResponse> {
    const { clientId, type, ...restOfData } = createDossierDto;

    // Vérifier l'existence du client
    await this.prisma.client.findUniqueOrThrow({ where: { id: clientId } });

    // Si un responsable est spécifié, vérifier son existence
    if (restOfData.responsableId) {
      await this.prisma.utilisateur.findUniqueOrThrow({
        where: { id: restOfData.responsableId },
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Générer un numéro unique pour le dossier
      const numeroUnique = await NumeroUniqueUtil.generateNumeroDossier(
        tx,
        type,
      );

      // Préparer les données du dossier principal en excluant les sous-types
      const dossierData: any = {
        clientId,
        type,
        numeroUnique,
        statut: restOfData.statut || 'OUVERT',
        titre: restOfData.titre,
        description: restOfData.description,
        responsableId: restOfData.responsableId,
        valeurFinanciere: restOfData.valeurFinanciere,
        risqueJuridique: restOfData.risqueJuridique,
        chancesSucces: restOfData.chancesSucces,
      };

      // Créer le dossier principal
      const newDossier = await tx.dossier.create({
        data: dossierData,
      });

      // Créer le sous-type de dossier approprié
      let subtypeData: any = null;
      switch (type) {
        case 'SINISTRE_CORPOREL':
          if (createDossierDto.sinistreCorporel) {
            subtypeData = await tx.sinistreCorporel.create({
              data: {
                dossierId: newDossier.id,
                dateAccident: createDossierDto.sinistreCorporel.dateAccident
                  ? new Date(createDossierDto.sinistreCorporel.dateAccident)
                  : null,
                lieuAccident:
                  createDossierDto.sinistreCorporel.lieuAccident || null,
                numeroPvPolice:
                  createDossierDto.sinistreCorporel.numeroPvPolice || null,
                hopital: createDossierDto.sinistreCorporel.hopital || null,
                rapportMedical:
                  createDossierDto.sinistreCorporel.rapportMedical || null,
                graviteBlessure: createDossierDto.sinistreCorporel
                  .graviteBlessure
                  ? (createDossierDto.sinistreCorporel
                      .graviteBlessure as GraviteBlessure)
                  : GraviteBlessure.MINEUR,
                assureur: createDossierDto.sinistreCorporel.assureur || null,
                numeroSinistre:
                  createDossierDto.sinistreCorporel.numeroSinistre || null,
                temoins: createDossierDto.sinistreCorporel.temoins || null,
                prejudice: createDossierDto.sinistreCorporel.prejudice || null,
              },
            });
          }
          break;
        case 'SINISTRE_MATERIEL':
          if (createDossierDto.sinistreMateriel) {
            subtypeData = await tx.sinistreMateriel.create({
              data: {
                dossierId: newDossier.id,
                dateAccident: createDossierDto.sinistreMateriel.dateAccident
                  ? new Date(createDossierDto.sinistreMateriel.dateAccident)
                  : null,
                lieuAccident:
                  createDossierDto.sinistreMateriel.lieuAccident || null,
                categorieVehicule: createDossierDto.sinistreMateriel
                  .categorieVehicule
                  ? (createDossierDto.sinistreMateriel
                      .categorieVehicule as CategorieVehicule)
                  : null,
                marqueVehicule:
                  createDossierDto.sinistreMateriel.marqueVehicule || null,
                modeleVehicule:
                  createDossierDto.sinistreMateriel.modeleVehicule || null,
                immatriculation:
                  createDossierDto.sinistreMateriel.immatriculation || null,
                numeroChassis:
                  createDossierDto.sinistreMateriel.numeroChassis || null,
                numeroPvPolice:
                  createDossierDto.sinistreMateriel.numeroPvPolice || null,
                assureur: createDossierDto.sinistreMateriel.assureur || null,
                numeroSinistre:
                  createDossierDto.sinistreMateriel.numeroSinistre || null,
                estimationDegats:
                  createDossierDto.sinistreMateriel.estimationDegats || null,
                photosUrls:
                  createDossierDto.sinistreMateriel.photosUrls || null,
              },
            });
          }
          break;
        case 'SINISTRE_MORTEL':
          if (createDossierDto.sinistreMortel) {
            subtypeData = await tx.sinistreMortel.create({
              data: {
                dossierId: newDossier.id,
                dateDeces: createDossierDto.sinistreMortel.dateDeces
                  ? new Date(createDossierDto.sinistreMortel.dateDeces)
                  : null,
                lieuDeces: createDossierDto.sinistreMortel.lieuDeces || null,
                certificatDeces:
                  createDossierDto.sinistreMortel.certificatDeces || null,
                certificatMedicoLegal:
                  createDossierDto.sinistreMortel.certificatMedicoLegal || null,
                numeroPvPolice:
                  createDossierDto.sinistreMortel.numeroPvPolice || null,
                causeDeces: createDossierDto.sinistreMortel.causeDeces || null,
                ayantsDroit:
                  createDossierDto.sinistreMortel.ayantsDroit || null,
                indemniteReclamee:
                  createDossierDto.sinistreMortel.indemniteReclamee || null,
              },
            });
          }
          break;
        case 'IMMOBILIER':
          if (createDossierDto.immobilier) {
            subtypeData = await tx.immobilier.create({
              data: {
                dossierId: newDossier.id,
                adresseBien: createDossierDto.immobilier.adresseBien || null,
                numeroTitre: createDossierDto.immobilier.numeroTitre || null,
                numeroCadastre:
                  createDossierDto.immobilier.numeroCadastre || null,
                referenceNotaire:
                  createDossierDto.immobilier.referenceNotaire || null,
                regimeFoncier: createDossierDto.immobilier.regimeFoncier
                  ? (createDossierDto.immobilier.regimeFoncier as RegimeFoncier)
                  : null,
                surfaceM2: createDossierDto.immobilier.surfaceM2 || null,
                typeLitige: createDossierDto.immobilier.typeLitige || null,
                chefQuartier: createDossierDto.immobilier.chefQuartier || null,
                temoinsBornage:
                  createDossierDto.immobilier.temoinsBornage || null,
              },
            });
          }
          break;
        case 'SPORT':
          if (createDossierDto.sport) {
            subtypeData = await tx.sport.create({
              data: {
                dossierId: newDossier.id,
                club: createDossierDto.sport.club || null,
                competition: createDossierDto.sport.competition || null,
                dateIncident: createDossierDto.sport.dateIncident
                  ? new Date(createDossierDto.sport.dateIncident)
                  : null,
                instanceSportive:
                  createDossierDto.sport.instanceSportive || null,
                referenceContrat:
                  createDossierDto.sport.referenceContrat || null,
                sanctions: createDossierDto.sport.sanctions || null,
              },
            });
          }
          break;
        case 'CONTRAT':
          if (createDossierDto.contrat) {
            subtypeData = await tx.contrat.create({
              data: {
                dossierId: newDossier.id,
                partieA: createDossierDto.contrat.partieA || null,
                partieB: createDossierDto.contrat.partieB || null,
                dateEffet: createDossierDto.contrat.dateEffet
                  ? new Date(createDossierDto.contrat.dateEffet)
                  : null,
                dateExpiration: createDossierDto.contrat.dateExpiration
                  ? new Date(createDossierDto.contrat.dateExpiration)
                  : null,
                valeurContrat: createDossierDto.contrat.valeurContrat || null,
                loiApplicable:
                  createDossierDto.contrat.loiApplicable || 'CAMEROUN',
                referenceNotaire:
                  createDossierDto.contrat.referenceNotaire || null,
                contratUrl: createDossierDto.contrat.contratUrl || null,
              },
            });
          }
          break;
        case 'CONTENTIEUX':
          if (createDossierDto.contentieux) {
            subtypeData = await tx.contentieux.create({
              data: {
                dossierId: newDossier.id,
                numeroAffaire:
                  createDossierDto.contentieux.numeroAffaire || null,
                tribunal: createDossierDto.contentieux.tribunal || null,
                juridiction: createDossierDto.contentieux.juridiction || null,
                demandeur: createDossierDto.contentieux.demandeur || null,
                defendeur: createDossierDto.contentieux.defendeur || null,
                avocatPlaignant:
                  createDossierDto.contentieux.avocatPlaignant || null,
                avocatDefenseur:
                  createDossierDto.contentieux.avocatDefenseur || null,
                etapeProcedure: createDossierDto.contentieux.etapeProcedure
                  ? (createDossierDto.contentieux
                      .etapeProcedure as EtapeProcedures)
                  : null,
                montantReclame:
                  createDossierDto.contentieux.montantReclame || null,
                datesAudiences:
                  createDossierDto.contentieux.datesAudiences || null,
                depots: createDossierDto.contentieux.depots || null,
                rapportHussier:
                  createDossierDto.contentieux.rapportHussier || null,
              },
            });
          }
          break;
        case 'AUTRE':
          if (createDossierDto.autre) {
            subtypeData = await tx.autre.create({
              data: {
                dossierId: newDossier.id,
                champs: createDossierDto.autre.champs || null,
              },
            });
          }
          break;
      }

      return { dossier: newDossier, subtypeData };
    });

    // Invalider le cache
    await this.invalidateDossiersCache();

    // Récupérer le dossier complet avec les relations
    return this.findOne(result.dossier.id);
  }

  async findAll(query: QueryDossierDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'creeLe',
      sortOrder = 'desc',
      clientId,
      responsableId,
      type,
      statut,
      risqueJuridique,
      titre,
      dateMin,
      dateMax,
      chancesSuccesMin,
      chancesSuccesMax,
    } = query;

    const cacheKey = `dossiers:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) return cachedResult;

    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (responsableId) where.responsableId = responsableId;
    if (type) where.type = type;
    if (statut) where.statut = statut;
    if (risqueJuridique) where.risqueJuridique = risqueJuridique;
    if (titre) where.titre = { contains: titre, mode: 'insensitive' };
    if (dateMin || dateMax) {
      where.creeLe = {};
      if (dateMin) where.creeLe.gte = new Date(dateMin);
      if (dateMax) where.creeLe.lte = new Date(dateMax);
    }
    if (chancesSuccesMin !== undefined || chancesSuccesMax !== undefined) {
      where.chancesSucces = {};
      if (chancesSuccesMin !== undefined)
        where.chancesSucces.gte = chancesSuccesMin;
      if (chancesSuccesMax !== undefined)
        where.chancesSucces.lte = chancesSuccesMax;
    }

    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const [dossiers, total] = await Promise.all([
      this.prisma.dossier.findMany({
        where,
        ...paginationParams,
        include: {
          client: true,
          responsable: {
            select: { id: true, prenom: true, nom: true, email: true },
          },
          documents: {
            select: { id: true, titre: true, type: true, creeLe: true },
          },
          factures: {
            select: {
              id: true,
              numero: true,
              montantTotal: true,
              statut: true,
              creeLe: true,
            },
          },
          taches: {
            select: { id: true, titre: true, statut: true, dateLimite: true },
          },
          notes: {
            select: { id: true, titre: true, creeLe: true },
          },
          honoraires: {
            select: {
              id: true,
              montantTTC: true,
              statut: true,
              dateEmission: true,
            },
          },
          depenses: {
            select: {
              id: true,
              categorie: true,
              montant: true,
              dateDepense: true,
            },
          },
          provisions: {
            select: { id: true, montant: true, solde: true, statut: true },
          },
          sinistreCorporel: true,
          sinistreMateriel: true,
          sinistreMortel: true,
          immobilier: true,
          sport: true,
          contrat: true,
          contentieux: true,
          Autre: true, // Correction: 'Autre' avec une majuscule selon le schéma
        },
      }),
      this.prisma.dossier.count({ where }),
    ]);

    const result = PaginationUtil.createPaginationResult(dossiers, total, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    await this.cacheManager.set(cacheKey, result, 300);
    return result;
  }

  async findOne(id: string): Promise<DossierResponse> {
    const cacheKey = `dossier:${id}`;
    const cachedDossier = await this.cacheManager.get(cacheKey);
    if (cachedDossier) return cachedDossier as DossierResponse;

    const dossier = await this.prisma.dossier.findUnique({
      where: { id },
      include: {
        client: true,
        responsable: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
        documents: {
          select: { id: true, titre: true, type: true, creeLe: true },
        },
        factures: {
          select: {
            id: true,
            numero: true,
            montantTotal: true,
            statut: true,
            creeLe: true,
          },
        },
        taches: {
          select: { id: true, titre: true, statut: true, dateLimite: true },
        },
        notes: {
          select: { id: true, titre: true, creeLe: true },
        },
        honoraires: {
          select: {
            id: true,
            montantTTC: true,
            statut: true,
            dateEmission: true,
          },
        },
        depenses: {
          select: {
            id: true,
            categorie: true,
            montant: true,
            dateDepense: true,
          },
        },
        provisions: {
          select: { id: true, montant: true, solde: true, statut: true },
        },
        sinistreCorporel: true,
        sinistreMateriel: true,
        sinistreMortel: true,
        immobilier: true,
        sport: true,
        contrat: true,
        contentieux: true,
        Autre: true, // Correction: 'Autre' avec une majuscule selon le schéma
      },
    });

    if (!dossier)
      throw new NotFoundException(`Dossier avec l'ID ${id} non trouvé`);

    await this.cacheManager.set(cacheKey, dossier, 600);
    return dossier as DossierResponse;
  }

  async update(
    id: string,
    updateDossierDto: UpdateDossierDto,
  ): Promise<DossierResponse> {
    // Récupérer le dossier existant avec tous les sous-types
    const existingDossier = await this.prisma.dossier.findUnique({
      where: { id },
      include: {
        sinistreCorporel: true,
        sinistreMateriel: true,
        sinistreMortel: true,
        immobilier: true,
        sport: true,
        contrat: true,
        contentieux: true,
        Autre: true, // Correction: 'Autre' avec une majuscule selon le schéma
      },
    });

    if (!existingDossier)
      throw new NotFoundException(`Dossier avec l'ID ${id} non trouvé`);

    const { clientId, type, ...restOfData } = updateDossierDto;

    // Si un client est spécifié, vérifier son existence
    if (clientId) {
      await this.prisma.client.findUniqueOrThrow({ where: { id: clientId } });
    }

    // Si un responsable est spécifié, vérifier son existence
    if (restOfData.responsableId) {
      await this.prisma.utilisateur.findUniqueOrThrow({
        where: { id: restOfData.responsableId },
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Préparer les données de mise à jour du dossier principal
      const dossierUpdateData: any = {};

      if (clientId !== undefined) dossierUpdateData.clientId = clientId;
      if (type !== undefined) dossierUpdateData.type = type;
      if (restOfData.titre !== undefined)
        dossierUpdateData.titre = restOfData.titre;
      if (restOfData.description !== undefined)
        dossierUpdateData.description = restOfData.description;
      if (restOfData.responsableId !== undefined)
        dossierUpdateData.responsableId = restOfData.responsableId;
      if (restOfData.statut !== undefined)
        dossierUpdateData.statut = restOfData.statut;
      if (restOfData.valeurFinanciere !== undefined)
        dossierUpdateData.valeurFinanciere = restOfData.valeurFinanciere;
      if (restOfData.risqueJuridique !== undefined)
        dossierUpdateData.risqueJuridique = restOfData.risqueJuridique;
      if (restOfData.chancesSucces !== undefined)
        dossierUpdateData.chancesSucces = restOfData.chancesSucces;

      // Mettre à jour le dossier principal
      const updatedDossier = await tx.dossier.update({
        where: { id },
        data: dossierUpdateData,
      });

      // Mettre à jour le sous-type de dossier approprié
      const dossierType = type || existingDossier.type;
      switch (dossierType) {
        case 'SINISTRE_CORPOREL':
          if (updateDossierDto.sinistreCorporel) {
            if (existingDossier.sinistreCorporel) {
              await tx.sinistreCorporel.update({
                where: { dossierId: id },
                data: {
                  dateAccident: updateDossierDto.sinistreCorporel.dateAccident
                    ? new Date(updateDossierDto.sinistreCorporel.dateAccident)
                    : undefined,
                  lieuAccident:
                    updateDossierDto.sinistreCorporel.lieuAccident !== undefined
                      ? updateDossierDto.sinistreCorporel.lieuAccident
                      : undefined,
                  numeroPvPolice:
                    updateDossierDto.sinistreCorporel.numeroPvPolice !==
                    undefined
                      ? updateDossierDto.sinistreCorporel.numeroPvPolice
                      : undefined,
                  hopital:
                    updateDossierDto.sinistreCorporel.hopital !== undefined
                      ? updateDossierDto.sinistreCorporel.hopital
                      : undefined,
                  rapportMedical:
                    updateDossierDto.sinistreCorporel.rapportMedical !==
                    undefined
                      ? updateDossierDto.sinistreCorporel.rapportMedical
                      : undefined,
                  graviteBlessure:
                    updateDossierDto.sinistreCorporel.graviteBlessure !==
                    undefined
                      ? (updateDossierDto.sinistreCorporel
                          .graviteBlessure as GraviteBlessure)
                      : undefined,
                  assureur:
                    updateDossierDto.sinistreCorporel.assureur !== undefined
                      ? updateDossierDto.sinistreCorporel.assureur
                      : undefined,
                  numeroSinistre:
                    updateDossierDto.sinistreCorporel.numeroSinistre !==
                    undefined
                      ? updateDossierDto.sinistreCorporel.numeroSinistre
                      : undefined,
                  temoins:
                    updateDossierDto.sinistreCorporel.temoins !== undefined
                      ? updateDossierDto.sinistreCorporel.temoins
                      : undefined,
                  prejudice:
                    updateDossierDto.sinistreCorporel.prejudice !== undefined
                      ? updateDossierDto.sinistreCorporel.prejudice
                      : undefined,
                },
              });
            } else {
              await tx.sinistreCorporel.create({
                data: {
                  dossierId: id,
                  dateAccident: updateDossierDto.sinistreCorporel.dateAccident
                    ? new Date(updateDossierDto.sinistreCorporel.dateAccident)
                    : null,
                  lieuAccident:
                    updateDossierDto.sinistreCorporel.lieuAccident || null,
                  numeroPvPolice:
                    updateDossierDto.sinistreCorporel.numeroPvPolice || null,
                  hopital: updateDossierDto.sinistreCorporel.hopital || null,
                  rapportMedical:
                    updateDossierDto.sinistreCorporel.rapportMedical || null,
                  graviteBlessure: updateDossierDto.sinistreCorporel
                    .graviteBlessure
                    ? (updateDossierDto.sinistreCorporel
                        .graviteBlessure as GraviteBlessure)
                    : GraviteBlessure.MINEUR,
                  assureur: updateDossierDto.sinistreCorporel.assureur || null,
                  numeroSinistre:
                    updateDossierDto.sinistreCorporel.numeroSinistre || null,
                  temoins: updateDossierDto.sinistreCorporel.temoins || null,
                  prejudice:
                    updateDossierDto.sinistreCorporel.prejudice || null,
                },
              });
            }
          }
          break;
        case 'SINISTRE_MATERIEL':
          if (updateDossierDto.sinistreMateriel) {
            if (existingDossier.sinistreMateriel) {
              await tx.sinistreMateriel.update({
                where: { dossierId: id },
                data: {
                  dateAccident: updateDossierDto.sinistreMateriel.dateAccident
                    ? new Date(updateDossierDto.sinistreMateriel.dateAccident)
                    : undefined,
                  lieuAccident:
                    updateDossierDto.sinistreMateriel.lieuAccident !== undefined
                      ? updateDossierDto.sinistreMateriel.lieuAccident
                      : undefined,
                  categorieVehicule:
                    updateDossierDto.sinistreMateriel.categorieVehicule !==
                    undefined
                      ? (updateDossierDto.sinistreMateriel
                          .categorieVehicule as CategorieVehicule)
                      : undefined,
                  marqueVehicule:
                    updateDossierDto.sinistreMateriel.marqueVehicule !==
                    undefined
                      ? updateDossierDto.sinistreMateriel.marqueVehicule
                      : undefined,
                  modeleVehicule:
                    updateDossierDto.sinistreMateriel.modeleVehicule !==
                    undefined
                      ? updateDossierDto.sinistreMateriel.modeleVehicule
                      : undefined,
                  immatriculation:
                    updateDossierDto.sinistreMateriel.immatriculation !==
                    undefined
                      ? updateDossierDto.sinistreMateriel.immatriculation
                      : undefined,
                  numeroChassis:
                    updateDossierDto.sinistreMateriel.numeroChassis !==
                    undefined
                      ? updateDossierDto.sinistreMateriel.numeroChassis
                      : undefined,
                  numeroPvPolice:
                    updateDossierDto.sinistreMateriel.numeroPvPolice !==
                    undefined
                      ? updateDossierDto.sinistreMateriel.numeroPvPolice
                      : undefined,
                  assureur:
                    updateDossierDto.sinistreMateriel.assureur !== undefined
                      ? updateDossierDto.sinistreMateriel.assureur
                      : undefined,
                  numeroSinistre:
                    updateDossierDto.sinistreMateriel.numeroSinistre !==
                    undefined
                      ? updateDossierDto.sinistreMateriel.numeroSinistre
                      : undefined,
                  estimationDegats:
                    updateDossierDto.sinistreMateriel.estimationDegats !==
                    undefined
                      ? updateDossierDto.sinistreMateriel.estimationDegats
                      : undefined,
                  photosUrls:
                    updateDossierDto.sinistreMateriel.photosUrls !== undefined
                      ? updateDossierDto.sinistreMateriel.photosUrls
                      : undefined,
                },
              });
            } else {
              await tx.sinistreMateriel.create({
                data: {
                  dossierId: id,
                  dateAccident: updateDossierDto.sinistreMateriel.dateAccident
                    ? new Date(updateDossierDto.sinistreMateriel.dateAccident)
                    : null,
                  lieuAccident:
                    updateDossierDto.sinistreMateriel.lieuAccident || null,
                  categorieVehicule: updateDossierDto.sinistreMateriel
                    .categorieVehicule
                    ? (updateDossierDto.sinistreMateriel
                        .categorieVehicule as CategorieVehicule)
                    : null,
                  marqueVehicule:
                    updateDossierDto.sinistreMateriel.marqueVehicule || null,
                  modeleVehicule:
                    updateDossierDto.sinistreMateriel.modeleVehicule || null,
                  immatriculation:
                    updateDossierDto.sinistreMateriel.immatriculation || null,
                  numeroChassis:
                    updateDossierDto.sinistreMateriel.numeroChassis || null,
                  numeroPvPolice:
                    updateDossierDto.sinistreMateriel.numeroPvPolice || null,
                  assureur: updateDossierDto.sinistreMateriel.assureur || null,
                  numeroSinistre:
                    updateDossierDto.sinistreMateriel.numeroSinistre || null,
                  estimationDegats:
                    updateDossierDto.sinistreMateriel.estimationDegats || null,
                  photosUrls:
                    updateDossierDto.sinistreMateriel.photosUrls || null,
                },
              });
            }
          }
          break;
        case 'SINISTRE_MORTEL':
          if (updateDossierDto.sinistreMortel) {
            if (existingDossier.sinistreMortel) {
              await tx.sinistreMortel.update({
                where: { dossierId: id },
                data: {
                  dateDeces: updateDossierDto.sinistreMortel.dateDeces
                    ? new Date(updateDossierDto.sinistreMortel.dateDeces)
                    : undefined,
                  lieuDeces:
                    updateDossierDto.sinistreMortel.lieuDeces !== undefined
                      ? updateDossierDto.sinistreMortel.lieuDeces
                      : undefined,
                  certificatDeces:
                    updateDossierDto.sinistreMortel.certificatDeces !==
                    undefined
                      ? updateDossierDto.sinistreMortel.certificatDeces
                      : undefined,
                  certificatMedicoLegal:
                    updateDossierDto.sinistreMortel.certificatMedicoLegal !==
                    undefined
                      ? updateDossierDto.sinistreMortel.certificatMedicoLegal
                      : undefined,
                  numeroPvPolice:
                    updateDossierDto.sinistreMortel.numeroPvPolice !== undefined
                      ? updateDossierDto.sinistreMortel.numeroPvPolice
                      : undefined,
                  causeDeces:
                    updateDossierDto.sinistreMortel.causeDeces !== undefined
                      ? updateDossierDto.sinistreMortel.causeDeces
                      : undefined,
                  ayantsDroit:
                    updateDossierDto.sinistreMortel.ayantsDroit !== undefined
                      ? updateDossierDto.sinistreMortel.ayantsDroit
                      : undefined,
                  indemniteReclamee:
                    updateDossierDto.sinistreMortel.indemniteReclamee !==
                    undefined
                      ? updateDossierDto.sinistreMortel.indemniteReclamee
                      : undefined,
                },
              });
            } else {
              await tx.sinistreMortel.create({
                data: {
                  dossierId: id,
                  dateDeces: updateDossierDto.sinistreMortel.dateDeces
                    ? new Date(updateDossierDto.sinistreMortel.dateDeces)
                    : null,
                  lieuDeces: updateDossierDto.sinistreMortel.lieuDeces || null,
                  certificatDeces:
                    updateDossierDto.sinistreMortel.certificatDeces || null,
                  certificatMedicoLegal:
                    updateDossierDto.sinistreMortel.certificatMedicoLegal ||
                    null,
                  numeroPvPolice:
                    updateDossierDto.sinistreMortel.numeroPvPolice || null,
                  causeDeces:
                    updateDossierDto.sinistreMortel.causeDeces || null,
                  ayantsDroit:
                    updateDossierDto.sinistreMortel.ayantsDroit || null,
                  indemniteReclamee:
                    updateDossierDto.sinistreMortel.indemniteReclamee || null,
                },
              });
            }
          }
          break;
        case 'IMMOBILIER':
          if (updateDossierDto.immobilier) {
            if (existingDossier.immobilier) {
              await tx.immobilier.update({
                where: { dossierId: id },
                data: {
                  adresseBien:
                    updateDossierDto.immobilier.adresseBien !== undefined
                      ? updateDossierDto.immobilier.adresseBien
                      : undefined,
                  numeroTitre:
                    updateDossierDto.immobilier.numeroTitre !== undefined
                      ? updateDossierDto.immobilier.numeroTitre
                      : undefined,
                  numeroCadastre:
                    updateDossierDto.immobilier.numeroCadastre !== undefined
                      ? updateDossierDto.immobilier.numeroCadastre
                      : undefined,
                  referenceNotaire:
                    updateDossierDto.immobilier.referenceNotaire !== undefined
                      ? updateDossierDto.immobilier.referenceNotaire
                      : undefined,
                  regimeFoncier:
                    updateDossierDto.immobilier.regimeFoncier !== undefined
                      ? (updateDossierDto.immobilier
                          .regimeFoncier as RegimeFoncier)
                      : undefined,
                  surfaceM2:
                    updateDossierDto.immobilier.surfaceM2 !== undefined
                      ? updateDossierDto.immobilier.surfaceM2
                      : undefined,
                  typeLitige:
                    updateDossierDto.immobilier.typeLitige !== undefined
                      ? updateDossierDto.immobilier.typeLitige
                      : undefined,
                  chefQuartier:
                    updateDossierDto.immobilier.chefQuartier !== undefined
                      ? updateDossierDto.immobilier.chefQuartier
                      : undefined,
                  temoinsBornage:
                    updateDossierDto.immobilier.temoinsBornage !== undefined
                      ? updateDossierDto.immobilier.temoinsBornage
                      : undefined,
                },
              });
            } else {
              await tx.immobilier.create({
                data: {
                  dossierId: id,
                  adresseBien: updateDossierDto.immobilier.adresseBien || null,
                  numeroTitre: updateDossierDto.immobilier.numeroTitre || null,
                  numeroCadastre:
                    updateDossierDto.immobilier.numeroCadastre || null,
                  referenceNotaire:
                    updateDossierDto.immobilier.referenceNotaire || null,
                  regimeFoncier: updateDossierDto.immobilier.regimeFoncier
                    ? (updateDossierDto.immobilier
                        .regimeFoncier as RegimeFoncier)
                    : null,
                  surfaceM2: updateDossierDto.immobilier.surfaceM2 || null,
                  typeLitige: updateDossierDto.immobilier.typeLitige || null,
                  chefQuartier:
                    updateDossierDto.immobilier.chefQuartier || null,
                  temoinsBornage:
                    updateDossierDto.immobilier.temoinsBornage || null,
                },
              });
            }
          }
          break;
        case 'SPORT':
          if (updateDossierDto.sport) {
            if (existingDossier.sport) {
              await tx.sport.update({
                where: { dossierId: id },
                data: {
                  club:
                    updateDossierDto.sport.club !== undefined
                      ? updateDossierDto.sport.club
                      : undefined,
                  competition:
                    updateDossierDto.sport.competition !== undefined
                      ? updateDossierDto.sport.competition
                      : undefined,
                  dateIncident: updateDossierDto.sport.dateIncident
                    ? new Date(updateDossierDto.sport.dateIncident)
                    : undefined,
                  instanceSportive:
                    updateDossierDto.sport.instanceSportive !== undefined
                      ? updateDossierDto.sport.instanceSportive
                      : undefined,
                  referenceContrat:
                    updateDossierDto.sport.referenceContrat !== undefined
                      ? updateDossierDto.sport.referenceContrat
                      : undefined,
                  sanctions:
                    updateDossierDto.sport.sanctions !== undefined
                      ? updateDossierDto.sport.sanctions
                      : undefined,
                },
              });
            } else {
              await tx.sport.create({
                data: {
                  dossierId: id,
                  club: updateDossierDto.sport.club || null,
                  competition: updateDossierDto.sport.competition || null,
                  dateIncident: updateDossierDto.sport.dateIncident
                    ? new Date(updateDossierDto.sport.dateIncident)
                    : null,
                  instanceSportive:
                    updateDossierDto.sport.instanceSportive || null,
                  referenceContrat:
                    updateDossierDto.sport.referenceContrat || null,
                  sanctions: updateDossierDto.sport.sanctions || null,
                },
              });
            }
          }
          break;
        case 'CONTRAT':
          if (updateDossierDto.contrat) {
            if (existingDossier.contrat) {
              await tx.contrat.update({
                where: { dossierId: id },
                data: {
                  partieA:
                    updateDossierDto.contrat.partieA !== undefined
                      ? updateDossierDto.contrat.partieA
                      : undefined,
                  partieB:
                    updateDossierDto.contrat.partieB !== undefined
                      ? updateDossierDto.contrat.partieB
                      : undefined,
                  dateEffet: updateDossierDto.contrat.dateEffet
                    ? new Date(updateDossierDto.contrat.dateEffet)
                    : undefined,
                  dateExpiration: updateDossierDto.contrat.dateExpiration
                    ? new Date(updateDossierDto.contrat.dateExpiration)
                    : undefined,
                  valeurContrat:
                    updateDossierDto.contrat.valeurContrat !== undefined
                      ? updateDossierDto.contrat.valeurContrat
                      : undefined,
                  loiApplicable:
                    updateDossierDto.contrat.loiApplicable !== undefined
                      ? updateDossierDto.contrat.loiApplicable
                      : undefined,
                  referenceNotaire:
                    updateDossierDto.contrat.referenceNotaire !== undefined
                      ? updateDossierDto.contrat.referenceNotaire
                      : undefined,
                  contratUrl:
                    updateDossierDto.contrat.contratUrl !== undefined
                      ? updateDossierDto.contrat.contratUrl
                      : undefined,
                },
              });
            } else {
              await tx.contrat.create({
                data: {
                  dossierId: id,
                  partieA: updateDossierDto.contrat.partieA || null,
                  partieB: updateDossierDto.contrat.partieB || null,
                  dateEffet: updateDossierDto.contrat.dateEffet
                    ? new Date(updateDossierDto.contrat.dateEffet)
                    : null,
                  dateExpiration: updateDossierDto.contrat.dateExpiration
                    ? new Date(updateDossierDto.contrat.dateExpiration)
                    : null,
                  valeurContrat: updateDossierDto.contrat.valeurContrat || null,
                  loiApplicable:
                    updateDossierDto.contrat.loiApplicable || 'CAMEROUN',
                  referenceNotaire:
                    updateDossierDto.contrat.referenceNotaire || null,
                  contratUrl: updateDossierDto.contrat.contratUrl || null,
                },
              });
            }
          }
          break;
        case 'CONTENTIEUX':
          if (updateDossierDto.contentieux) {
            if (existingDossier.contentieux) {
              await tx.contentieux.update({
                where: { dossierId: id },
                data: {
                  numeroAffaire:
                    updateDossierDto.contentieux.numeroAffaire !== undefined
                      ? updateDossierDto.contentieux.numeroAffaire
                      : undefined,
                  tribunal:
                    updateDossierDto.contentieux.tribunal !== undefined
                      ? updateDossierDto.contentieux.tribunal
                      : undefined,
                  juridiction:
                    updateDossierDto.contentieux.juridiction !== undefined
                      ? updateDossierDto.contentieux.juridiction
                      : undefined,
                  demandeur:
                    updateDossierDto.contentieux.demandeur !== undefined
                      ? updateDossierDto.contentieux.demandeur
                      : undefined,
                  defendeur:
                    updateDossierDto.contentieux.defendeur !== undefined
                      ? updateDossierDto.contentieux.defendeur
                      : undefined,
                  avocatPlaignant:
                    updateDossierDto.contentieux.avocatPlaignant !== undefined
                      ? updateDossierDto.contentieux.avocatPlaignant
                      : undefined,
                  avocatDefenseur:
                    updateDossierDto.contentieux.avocatDefenseur !== undefined
                      ? updateDossierDto.contentieux.avocatDefenseur
                      : undefined,
                  etapeProcedure: updateDossierDto.contentieux.etapeProcedure
                    ? (updateDossierDto.contentieux
                        .etapeProcedure as EtapeProcedures)
                    : undefined,
                  montantReclame:
                    updateDossierDto.contentieux.montantReclame !== undefined
                      ? updateDossierDto.contentieux.montantReclame
                      : undefined,
                  datesAudiences:
                    updateDossierDto.contentieux.datesAudiences !== undefined
                      ? updateDossierDto.contentieux.datesAudiences
                      : undefined,
                  depots:
                    updateDossierDto.contentieux.depots !== undefined
                      ? updateDossierDto.contentieux.depots
                      : undefined,
                  rapportHussier:
                    updateDossierDto.contentieux.rapportHussier !== undefined
                      ? updateDossierDto.contentieux.rapportHussier
                      : undefined,
                },
              });
            } else {
              await tx.contentieux.create({
                data: {
                  dossierId: id,
                  numeroAffaire:
                    updateDossierDto.contentieux.numeroAffaire || null,
                  tribunal: updateDossierDto.contentieux.tribunal || null,
                  juridiction: updateDossierDto.contentieux.juridiction || null,
                  demandeur: updateDossierDto.contentieux.demandeur || null,
                  defendeur: updateDossierDto.contentieux.defendeur || null,
                  avocatPlaignant:
                    updateDossierDto.contentieux.avocatPlaignant || null,
                  avocatDefenseur:
                    updateDossierDto.contentieux.avocatDefenseur || null,
                  etapeProcedure: updateDossierDto.contentieux.etapeProcedure
                    ? (updateDossierDto.contentieux
                        .etapeProcedure as EtapeProcedures)
                    : null,
                  montantReclame:
                    updateDossierDto.contentieux.montantReclame || null,
                  datesAudiences:
                    updateDossierDto.contentieux.datesAudiences || null,
                  depots: updateDossierDto.contentieux.depots || null,
                  rapportHussier:
                    updateDossierDto.contentieux.rapportHussier || null,
                },
              });
            }
          }
          break;
        case 'AUTRE':
          if (updateDossierDto.autre) {
            if (existingDossier.Autre) {
              await tx.autre.update({
                where: { dossierId: id },
                data: {
                  champs:
                    updateDossierDto.autre.champs !== undefined
                      ? updateDossierDto.autre.champs
                      : undefined,
                },
              });
            } else {
              await tx.autre.create({
                data: {
                  dossierId: id,
                  champs: updateDossierDto.autre.champs || null,
                },
              });
            }
          }
          break;
      }

      return updatedDossier;
    });

    await this.cacheManager.del(`dossier:${id}`);
    await this.invalidateDossiersCache();
    return this.findOne(result.id);
  }

  async remove(id: string): Promise<void> {
    const existingDossier = await this.prisma.dossier.findUnique({
      where: { id },
    });
    if (!existingDossier)
      throw new NotFoundException(`Dossier avec l'ID ${id} non trouvé`);

    // Le `onDelete: Cascade` dans le schéma s'occupera de supprimer les sous-types et les relations associées.
    await this.prisma.dossier.delete({ where: { id } });

    await this.cacheManager.del(`dossier:${id}`);
    await this.invalidateDossiersCache();
  }

  // -------------------- MÉTHODES SPÉCIFIQUES --------------------

  async getDossiersByClient(clientId: string, query: QueryDossierDto) {
    return this.findAll({ ...query, clientId });
  }

  async getDossiersByResponsable(
    responsableId: string,
    query: QueryDossierDto,
  ) {
    return this.findAll({ ...query, responsableId });
  }

  async getDossiersByType(type: string, query: QueryDossierDto) {
    return this.findAll({ ...query, type: type as TypeDossier });
  }

  async getDossiersByStatut(statut: string, query: QueryDossierDto) {
    return this.findAll({ ...query, statut: statut as StatutDossier });
  }

  async getDossiersEnCours(query: QueryDossierDto) {
    return this.findAll({ ...query, statut: 'EN_COURS' });
  }

  async getDossiersClos(query: QueryDossierDto) {
    return this.findAll({ ...query, statut: 'CLOS' });
  }

  async getDossiersArchives(query: QueryDossierDto) {
    return this.findAll({ ...query, statut: 'ARCHIVE' });
  }

  async changerStatut(id: string, statut: string): Promise<DossierResponse> {
    const existingDossier = await this.prisma.dossier.findUnique({
      where: { id },
    });
    if (!existingDossier)
      throw new NotFoundException(`Dossier avec l'ID ${id} non trouvé`);

    const updatedDossier = await this.prisma.dossier.update({
      where: { id },
      data: { statut: statut as StatutDossier },
    });

    await this.cacheManager.del(`dossier:${id}`);
    await this.invalidateDossiersCache();
    return this.findOne(updatedDossier.id);
  }

  async assignerResponsable(
    id: string,
    responsableId: string,
  ): Promise<DossierResponse> {
    const existingDossier = await this.prisma.dossier.findUnique({
      where: { id },
    });
    if (!existingDossier)
      throw new NotFoundException(`Dossier avec l'ID ${id} non trouvé`);

    await this.prisma.utilisateur.findUniqueOrThrow({
      where: { id: responsableId },
    });

    const updatedDossier = await this.prisma.dossier.update({
      where: { id },
      data: { responsableId },
    });

    await this.cacheManager.del(`dossier:${id}`);
    await this.invalidateDossiersCache();
    return this.findOne(updatedDossier.id);
  }

  async getStats() {
    const cacheKey = 'dossiers-stats';
    const cachedStats = await this.cacheManager.get(cacheKey);
    if (cachedStats) return cachedStats;

    const [
      totalDossiers,
      dossiersParStatut,
      dossiersParType,
      dossiersParRisque,
      dossiersParResponsable,
      dossiersRecentes,
    ] = await Promise.all([
      this.prisma.dossier.count(),
      this.prisma.dossier.groupBy({
        by: ['statut'],
        _count: true,
      }),
      this.prisma.dossier.groupBy({
        by: ['type'],
        _count: true,
      }),
      this.prisma.dossier.groupBy({
        by: ['risqueJuridique'],
        _count: true,
      }),
      this.prisma.dossier.groupBy({
        by: ['responsableId'],
        _count: true,
        where: { responsableId: { not: null } },
      }),
      this.prisma.dossier.findMany({
        take: 5,
        orderBy: { creeLe: 'desc' },
        select: {
          id: true,
          numeroUnique: true,
          titre: true,
          type: true,
          statut: true,
          creeLe: true,
          client: {
            select: { id: true, prenom: true, nom: true, entreprise: true },
          },
        },
      }),
    ]);

    // Récupérer les noms des responsables
    const responsablesIds = dossiersParResponsable
      .map((r) => r.responsableId)
      .filter(Boolean);
    const responsables = await this.prisma.utilisateur.findMany({
      where: { id: { in: responsablesIds as string[] } },
      select: { id: true, prenom: true, nom: true },
    });

    const responsablesMap = responsables.reduce((acc, resp) => {
      acc[resp.id] = `${resp.prenom} ${resp.nom}`;
      return acc;
    }, {});

    const stats = {
      totalDossiers,
      dossiersParStatut: dossiersParStatut.map((item) => ({
        statut: item.statut,
        count: item._count,
      })),
      dossiersParType: dossiersParType.map((item) => ({
        type: item.type,
        count: item._count,
      })),
      dossiersParRisque: dossiersParRisque.map((item) => ({
        risque: item.risqueJuridique,
        count: item._count,
      })),
      dossiersParResponsable: dossiersParResponsable.map((item) => ({
        responsableId: item.responsableId,
        responsableNom:
          responsablesMap[item.responsableId || ''] || 'Non assigné',
        count: item._count,
      })),
      dossiersRecentes,
    };

    await this.cacheManager.set(cacheKey, stats, 600);
    return stats;
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private async invalidateDossiersCache(): Promise<void> {
    try {
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores)
      ) {
        const store = this.cacheManager.stores[0];
        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('dossiers:*');
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
        "Erreur lors de l'invalidation du cache des dossiers:",
        error,
      );
    }
  }
}
