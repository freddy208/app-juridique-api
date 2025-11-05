import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { ModePaiement, StatutPaiement } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryPaiementDto {
  // --- Propriétés de pagination ---
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  sortBy?: string = 'date';

  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  // --- Propriétés de filtre ---
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  factureId?: string;

  @IsOptional()
  @IsString()
  honoraireId?: string;

  @IsOptional()
  @IsEnum(StatutPaiement)
  statut?: StatutPaiement;

  @IsOptional()
  @IsEnum(ModePaiement)
  mode?: ModePaiement;

  @IsOptional()
  @IsDateString()
  dateMin?: string;

  @IsOptional()
  @IsDateString()
  dateMax?: string;
}
