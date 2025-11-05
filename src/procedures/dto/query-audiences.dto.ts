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
import { StatutAudience } from '@prisma/client';

export class QueryAudiencesDto {
  @ApiProperty({ description: 'Numéro de page', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: "Nombre d'éléments par page",
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Champ de tri',
    required: false,
    default: 'dateAudience',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'dateAudience';

  @ApiProperty({ description: 'Ordre de tri', required: false, default: 'asc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiProperty({ description: 'ID de la procédure', required: false })
  @IsOptional()
  @IsUUID()
  procedureId?: string;

  @ApiProperty({
    description: "Statut de l'audience",
    enum: StatutAudience,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutAudience)
  statut?: StatutAudience;

  @ApiProperty({ description: "Date d'audience minimale", required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateAudienceMin?: Date;

  @ApiProperty({ description: "Date d'audience maximale", required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateAudienceMax?: Date;

  @ApiProperty({ description: 'Terme de recherche', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Inclure uniquement les audiences à venir',
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  aVenirSeulement?: boolean;

  @ApiProperty({
    description: 'Inclure uniquement les audiences de la semaine',
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  cetteSemaineSeulement?: boolean;
}
