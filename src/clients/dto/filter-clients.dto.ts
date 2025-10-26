// dto/filter-clients.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { StatutClient } from '@prisma/client';
import { Transform } from 'class-transformer';

export class FilterClientsDto {
  @ApiPropertyOptional({
    description: 'Filtrer par statut',
    enum: StatutClient,
  })
  @IsOptional()
  @IsEnum(StatutClient)
  statut?: StatutClient;

  @ApiPropertyOptional({
    description: 'Recherche par nom, prénom ou entreprise',
    example: 'Dupont',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrer les clients VIP uniquement',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  vipOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrer par présence de dossiers actifs',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasActiveDossiers?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrer par présence de factures impayées',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasUnpaidInvoices?: boolean;

  @ApiPropertyOptional({
    description: 'Date de création début (format ISO)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  dateCreationDebut?: string;

  @ApiPropertyOptional({
    description: 'Date de création fin (format ISO)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsString()
  dateCreationFin?: string;

  @ApiPropertyOptional({
    description: "Chiffre d'affaires minimum",
    example: 1000000,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  chiffreAffairesMin?: number;

  @ApiPropertyOptional({
    description: "Chiffre d'affaires maximum",
    example: 10000000,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  chiffreAffairesMax?: number;
}
