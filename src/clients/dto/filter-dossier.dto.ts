// src/clients/dto/filter-dossier.dto.ts
import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutDossier } from '@prisma/client';

export class FilterDossierDto {
  @IsOptional()
  @IsEnum(StatutDossier)
  statutDossier?: StatutDossier;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  skip = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  take = 10;
}
