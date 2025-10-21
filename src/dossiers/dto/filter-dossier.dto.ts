// src/dossiers/dto/filter-dossier.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutDossier, TypeDossier } from '@prisma/client';

export class FilterDossierDto {
  @ApiPropertyOptional({
    description: 'Recherche par titre, numéro unique, client',
  })
  @IsOptional()
  @IsString()
  search?: string;

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

  @ApiPropertyOptional({ description: 'Filtrer par date de création (début)' })
  @IsOptional()
  @Type(() => Date)
  dateCreationDebut?: Date;

  @ApiPropertyOptional({ description: 'Filtrer par date de création (fin)' })
  @IsOptional()
  @Type(() => Date)
  dateCreationFin?: Date;

  @ApiPropertyOptional({
    description: 'Filtrer par date de modification (début)',
  })
  @IsOptional()
  @Type(() => Date)
  dateModificationDebut?: Date;

  @ApiPropertyOptional({
    description: 'Filtrer par date de modification (fin)',
  })
  @IsOptional()
  @Type(() => Date)
  dateModificationFin?: Date;

  @ApiPropertyOptional({ description: 'Champ de tri' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Ordre de tri (asc ou desc)' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Pagination - skip' })
  @Type(() => Number)
  @IsNumber()
  skip = 0;

  @ApiPropertyOptional({ description: 'Pagination - take' })
  @Type(() => Number)
  @IsNumber()
  take = 10;
}
