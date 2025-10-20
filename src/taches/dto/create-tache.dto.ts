import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  Length,
} from 'class-validator';
import { StatutTache, TachePriorite } from '@prisma/client';

export class CreateTacheDto {
  @ApiProperty({ description: 'Titre de la tâche' })
  @IsString()
  @Length(3, 255)
  titre: string;

  @ApiPropertyOptional({ description: 'Description détaillée' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ID du dossier associé' })
  @IsOptional()
  @IsUUID()
  dossierId?: string;

  @ApiPropertyOptional({ description: 'ID de l’utilisateur assigné' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Date limite de la tâche (format ISO)' })
  @IsOptional()
  @IsDateString()
  dateLimite?: string;

  @ApiPropertyOptional({ enum: StatutTache, description: 'Statut initial' })
  @IsOptional()
  @IsEnum(StatutTache)
  statut?: StatutTache;
  @ApiPropertyOptional({
    enum: TachePriorite,
    description: 'Priorité de la tâche (BASSE, MOYENNE, HAUTE, URGENTE)',
    default: TachePriorite.MOYENNE,
  })
  @IsOptional()
  @IsEnum(TachePriorite)
  priorite?: TachePriorite;
}
