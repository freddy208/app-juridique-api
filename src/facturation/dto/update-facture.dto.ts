import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { StatutFacture } from '@prisma/client';
import { Type } from 'class-transformer';

// On garde ce DTO pour la mise à jour des lignes
class UpdateLigneFactureDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  quantite?: number;

  @IsOptional()
  @IsNumber()
  prixUnitaire?: number;
}

// On redéfinit entièrement le DTO de mise à jour au lieu d'étendre PartialType
export class UpdateFactureDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  dossierId?: string;

  @IsOptional()
  @IsString()
  dateEcheance?: string;

  @IsOptional()
  @IsEnum(StatutFacture)
  statut?: StatutFacture;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateLigneFactureDto)
  lignes?: UpdateLigneFactureDto[];
}
