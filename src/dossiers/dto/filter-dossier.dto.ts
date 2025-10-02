// src/dossiers/dto/filter-dossier.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutDossier, TypeDossier } from '@prisma/client';

export class FilterDossierDto {
  @ApiPropertyOptional({
    description: 'Filtrer par statut du dossier',
    enum: StatutDossier,
  })
  @IsOptional()
  @IsEnum(StatutDossier)
  statut?: StatutDossier;

  @ApiPropertyOptional({
    description: 'Filtrer par type de dossier',
    enum: TypeDossier,
  })
  @IsOptional()
  @IsEnum(TypeDossier)
  type?: TypeDossier;

  @ApiPropertyOptional({ description: 'Filtrer par ID du client' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par ID du responsable' })
  @IsOptional()
  @IsString()
  responsableId?: string;

  @ApiPropertyOptional({ description: 'Pagination - skip' })
  @Type(() => Number)
  @IsNumber()
  skip = 0;

  @ApiPropertyOptional({ description: 'Pagination - take' })
  @Type(() => Number)
  @IsNumber()
  take = 10;
}
