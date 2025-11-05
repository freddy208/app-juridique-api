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
import { TachePriorite, StatutTache } from '@prisma/client';

export class QueryTachesDto {
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

  @ApiProperty({ description: "ID de l'utilisateur assigné", required: false })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiProperty({ description: 'ID du créateur', required: false })
  @IsOptional()
  @IsUUID()
  creeParId?: string;

  @ApiProperty({ description: 'ID du dossier', required: false })
  @IsOptional()
  @IsUUID()
  dossierId?: string;

  @ApiProperty({
    description: 'Statut de la tâche',
    enum: StatutTache,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutTache)
  statut?: StatutTache;

  @ApiProperty({
    description: 'Priorité de la tâche',
    enum: TachePriorite,
    required: false,
  })
  @IsOptional()
  @IsEnum(TachePriorite)
  priorite?: TachePriorite;

  @ApiProperty({ description: 'Date limite minimale', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateLimiteMin?: Date;

  @ApiProperty({ description: 'Date limite maximale', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateLimiteMax?: Date;

  @ApiProperty({ description: 'Terme de recherche', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filtrer les tâches en retard', required: false })
  @IsOptional()
  @Type(() => Boolean)
  enRetard?: boolean;
}
