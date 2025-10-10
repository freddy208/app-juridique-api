// src/evenements/dto/filter-evenement.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatutEvenement } from '@prisma/client';

export class FilterEvenementDto {
  @ApiPropertyOptional({ description: 'Filtrer par dossier ID' })
  @IsOptional()
  @IsUUID()
  dossierId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par créateur ID' })
  @IsOptional()
  @IsUUID()
  creeParId?: string;

  @ApiPropertyOptional({
    enum: StatutEvenement,
    description: 'Filtrer par statut',
  })
  @IsOptional()
  @IsEnum(StatutEvenement)
  statut?: StatutEvenement;

  @ApiPropertyOptional({ description: 'Rechercher par titre ou description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Date de début minimale',
    example: '2025-10-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional({
    description: 'Date de fin maximale',
    example: '2025-10-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @ApiPropertyOptional({
    description: 'Nombre d’éléments à ignorer (pagination)',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional({
    description: 'Nombre d’éléments à prendre (pagination)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number = 10;
}
