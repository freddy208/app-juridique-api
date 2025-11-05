// src/dossiers/dto/query-dossier.dto.ts
import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TypeDossier, StatutDossier, NiveauRisque } from '@prisma/client';

export class QueryDossierDto {
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
  @IsString()
  sortBy?: string = 'creeLe';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  responsableId?: string;

  @IsOptional()
  @IsEnum(TypeDossier)
  type?: TypeDossier;

  @IsOptional()
  @IsEnum(StatutDossier)
  statut?: StatutDossier;

  @IsOptional()
  @IsEnum(NiveauRisque)
  risqueJuridique?: NiveauRisque;

  @IsOptional()
  @IsString()
  titre?: string;

  @IsOptional()
  @IsString()
  dateMin?: string;

  @IsOptional()
  @IsString()
  dateMax?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  chancesSuccesMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  chancesSuccesMax?: number;
}
