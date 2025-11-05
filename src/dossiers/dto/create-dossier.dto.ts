// src/dossiers/dto/create-dossier.dto.ts
import { TypeDossier, StatutDossier, NiveauRisque } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  IsDecimal,
  IsJSON,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTOs pour les sous-types de dossiers
export class SinistreCorporelDto {
  @IsOptional()
  @IsString()
  dateAccident?: string;

  @IsOptional()
  @IsString()
  lieuAccident?: string;

  @IsOptional()
  @IsString()
  numeroPvPolice?: string;

  @IsOptional()
  @IsString()
  hopital?: string;

  @IsOptional()
  @IsString()
  rapportMedical?: string;

  @IsOptional()
  @IsEnum(['MINEUR', 'MOYEN', 'GRAVE', 'CRITIQUE'])
  graviteBlessure?: string;

  @IsOptional()
  @IsString()
  assureur?: string;

  @IsOptional()
  @IsString()
  numeroSinistre?: string;

  @IsOptional()
  @IsJSON()
  temoins?: any;

  @IsOptional()
  @IsDecimal()
  prejudice?: number;
}

export class SinistreMaterielDto {
  @IsOptional()
  @IsString()
  dateAccident?: string;

  @IsOptional()
  @IsString()
  lieuAccident?: string;

  @IsOptional()
  @IsEnum(['VOITURE', 'MOTO', 'CAMION', 'AUTRE'])
  categorieVehicule?: string;

  @IsOptional()
  @IsString()
  marqueVehicule?: string;

  @IsOptional()
  @IsString()
  modeleVehicule?: string;

  @IsOptional()
  @IsString()
  immatriculation?: string;

  @IsOptional()
  @IsString()
  numeroChassis?: string;

  @IsOptional()
  @IsString()
  numeroPvPolice?: string;

  @IsOptional()
  @IsString()
  assureur?: string;

  @IsOptional()
  @IsString()
  numeroSinistre?: string;

  @IsOptional()
  @IsDecimal()
  estimationDegats?: number;

  @IsOptional()
  @IsJSON()
  photosUrls?: any;
}

export class SinistreMortelDto {
  @IsOptional()
  @IsString()
  dateDeces?: string;

  @IsOptional()
  @IsString()
  lieuDeces?: string;

  @IsOptional()
  @IsString()
  certificatDeces?: string;

  @IsOptional()
  @IsString()
  certificatMedicoLegal?: string;

  @IsOptional()
  @IsString()
  numeroPvPolice?: string;

  @IsOptional()
  @IsString()
  causeDeces?: string;

  @IsOptional()
  @IsJSON()
  ayantsDroit?: any;

  @IsOptional()
  @IsDecimal()
  indemniteReclamee?: number;
}

export class ImmobilierDto {
  @IsOptional()
  @IsString()
  adresseBien?: string;

  @IsOptional()
  @IsString()
  numeroTitre?: string;

  @IsOptional()
  @IsString()
  numeroCadastre?: string;

  @IsOptional()
  @IsString()
  referenceNotaire?: string;

  @IsOptional()
  @IsEnum(['TITRE_FONCIER', 'COUTUMIER', 'BAIL'])
  regimeFoncier?: string;

  @IsOptional()
  @IsDecimal()
  surfaceM2?: number;

  @IsOptional()
  @IsString()
  typeLitige?: string;

  @IsOptional()
  @IsString()
  chefQuartier?: string;

  @IsOptional()
  @IsJSON()
  temoinsBornage?: any;
}

export class SportDto {
  @IsOptional()
  @IsString()
  club?: string;

  @IsOptional()
  @IsString()
  competition?: string;

  @IsOptional()
  @IsString()
  dateIncident?: string;

  @IsOptional()
  @IsString()
  instanceSportive?: string;

  @IsOptional()
  @IsString()
  referenceContrat?: string;

  @IsOptional()
  @IsJSON()
  sanctions?: any;
}

export class ContratDto {
  @IsOptional()
  @IsString()
  partieA?: string;

  @IsOptional()
  @IsString()
  partieB?: string;

  @IsOptional()
  @IsString()
  dateEffet?: string;

  @IsOptional()
  @IsString()
  dateExpiration?: string;

  @IsOptional()
  @IsDecimal()
  valeurContrat?: number;

  @IsOptional()
  @IsString()
  loiApplicable?: string;

  @IsOptional()
  @IsString()
  referenceNotaire?: string;

  @IsOptional()
  @IsString()
  contratUrl?: string;
}

export class ContentieuxDto {
  @IsOptional()
  @IsString()
  numeroAffaire?: string;

  @IsOptional()
  @IsString()
  tribunal?: string;

  @IsOptional()
  @IsString()
  juridiction?: string;

  @IsOptional()
  @IsString()
  demandeur?: string;

  @IsOptional()
  @IsString()
  defendeur?: string;

  @IsOptional()
  @IsString()
  avocatPlaignant?: string;

  @IsOptional()
  @IsString()
  avocatDefenseur?: string;

  @IsOptional()
  @IsEnum(['INSTRUCTIVE', 'AUDIENCE', 'JUGEMENT', 'APPEL', 'EXECUTION'])
  etapeProcedure?: string;

  @IsOptional()
  @IsDecimal()
  montantReclame?: number;

  @IsOptional()
  @IsJSON()
  datesAudiences?: any;

  @IsOptional()
  @IsJSON()
  depots?: any;

  @IsOptional()
  @IsString()
  rapportHussier?: string;
}

export class AutreDto {
  @IsOptional()
  @IsJSON()
  champs?: any;
}

// DTO principal pour la création d'un dossier
export class CreateDossierDto {
  @IsUUID()
  clientId: string;

  @IsString()
  titre: string;

  @IsEnum(TypeDossier)
  type: TypeDossier;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  responsableId?: string;

  @IsOptional()
  @IsEnum(StatutDossier)
  statut?: StatutDossier;

  @IsOptional()
  @IsDecimal()
  valeurFinanciere?: number;

  @IsOptional()
  @IsEnum(NiveauRisque)
  risqueJuridique?: NiveauRisque;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  chancesSucces?: number;

  // Sous-types de dossiers
  @IsOptional()
  @Type(() => SinistreCorporelDto)
  sinistreCorporel?: SinistreCorporelDto;

  @IsOptional()
  @Type(() => SinistreMaterielDto)
  sinistreMateriel?: SinistreMaterielDto;

  @IsOptional()
  @Type(() => SinistreMortelDto)
  sinistreMortel?: SinistreMortelDto;

  @IsOptional()
  @Type(() => ImmobilierDto)
  immobilier?: ImmobilierDto;

  @IsOptional()
  @Type(() => SportDto)
  sport?: SportDto;

  @IsOptional()
  @Type(() => ContratDto)
  contrat?: ContratDto;

  @IsOptional()
  @Type(() => ContentieuxDto)
  contentieux?: ContentieuxDto;

  @IsOptional()
  @Type(() => AutreDto)
  autre?: AutreDto;
}
