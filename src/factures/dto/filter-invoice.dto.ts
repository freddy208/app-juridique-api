// src/factures/dto/filter-invoice.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatutFacture } from '@prisma/client';

export class FilterInvoiceDto {
  @ApiPropertyOptional({ description: 'Filtrer par ID du client' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par ID du dossier' })
  @IsOptional()
  @IsUUID()
  dossierId?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par statut de la facture',
    enum: StatutFacture,
  })
  @IsOptional()
  @IsEnum(StatutFacture)
  statut?: StatutFacture;

  @ApiPropertyOptional({
    description: 'Rechercher dans le montant ou référence facture',
  })
  @IsOptional()
  @IsString()
  recherche?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
