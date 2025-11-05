import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsEnum,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatutEvenement } from '@prisma/client';

export class QueryEvenementsDto {
  @ApiProperty({ description: 'Numéro de page', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: "Nombre d'éléments par page",
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Champ de tri',
    required: false,
    default: 'debut',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'debut';

  @ApiProperty({ description: 'Ordre de tri', required: false, default: 'asc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiProperty({ description: 'ID du créateur', required: false })
  @IsOptional()
  @IsUUID()
  creeParId?: string;

  @ApiProperty({ description: 'ID du dossier', required: false })
  @IsOptional()
  @IsUUID()
  dossierId?: string;

  @ApiProperty({
    description: "Statut de l'événement",
    enum: StatutEvenement,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutEvenement)
  statut?: StatutEvenement;

  @ApiProperty({ description: 'Date de début minimale', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateDebutMin?: Date;

  @ApiProperty({ description: 'Date de début maximale', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateDebutMax?: Date;

  @ApiProperty({ description: 'Date de fin minimale', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFinMin?: Date;

  @ApiProperty({ description: 'Date de fin maximale', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFinMax?: Date;

  @ApiProperty({ description: 'Terme de recherche', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Vue calendrier (jour, semaine, mois)',
    required: false,
  })
  @IsOptional()
  @IsString()
  view?: 'day' | 'week' | 'month';

  @ApiProperty({
    description: 'Date de référence pour la vue calendrier',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  referenceDate?: Date;
}
