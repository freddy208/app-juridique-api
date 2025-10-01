// src/clients/dto/filter-client.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutClient, TypeDossier } from '@prisma/client';

export class FilterClientDto {
  @ApiPropertyOptional({
    enum: StatutClient,
    description: 'Filtrer par statut',
  })
  @IsOptional()
  @IsEnum(StatutClient)
  statut?: StatutClient;

  @ApiPropertyOptional({ description: 'Recherche par prénom ou nom' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Recherche par entreprise' })
  @IsOptional()
  @IsString()
  nomEntreprise?: string;

  @ApiPropertyOptional({ description: 'Recherche par email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Recherche par téléphone' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({
    enum: TypeDossier,
    description: 'Filtrer par type de dossier lié',
  })
  @IsOptional()
  @IsEnum(TypeDossier)
  typeDossier?: TypeDossier;

  @ApiPropertyOptional({ description: 'Pagination - skip' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  skip?: number;

  @ApiPropertyOptional({ description: 'Pagination - take' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  take?: number;
}
