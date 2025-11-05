import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ModePaiement } from '@prisma/client';

export class CreatePaiementDto {
  @IsNumber()
  montant: number;

  @IsOptional()
  @IsString()
  factureId?: string;

  @IsOptional()
  @IsString()
  honoraireId?: string;

  @IsOptional()
  @IsString()
  clientId?: string; // Pour les paiements directs non liés à une facture/honoraire

  @IsEnum(ModePaiement)
  mode: ModePaiement;

  @IsOptional()
  @IsDateString()
  date?: string; // Permet de spécifier une date de paiement différente d'aujourd'hui

  @IsOptional()
  @IsString()
  referenceTransaction?: string; // Référence de virement, numéro de chèque, etc.
}
