import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatutNote } from '@prisma/client';

export class QueryNotesDto {
  @ApiProperty({ description: 'Filtrer par utilisateur', required: false })
  @IsOptional()
  @IsUUID()
  utilisateurId?: string;

  @ApiProperty({ description: 'Filtrer par client', required: false })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({ description: 'Filtrer par dossier', required: false })
  @IsOptional()
  @IsUUID()
  dossierId?: string;

  @ApiProperty({
    description: 'Filtrer par statut',
    enum: StatutNote,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutNote)
  statut?: StatutNote;

  @ApiProperty({
    description: 'Type de cible (client ou dossier)',
    required: false,
  })
  @IsOptional()
  @IsString()
  typeCible?: 'client' | 'dossier';

  @ApiProperty({ description: 'Terme de recherche', required: false })
  @IsOptional()
  @IsString()
  search?: string;

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
    default: 'creeLe',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'creeLe';

  @ApiProperty({
    description: 'Ordre de tri',
    required: false,
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
