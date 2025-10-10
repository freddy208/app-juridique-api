import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { StatutEvenement } from '@prisma/client';

export class UpdateEvenementDto {
  @ApiPropertyOptional({ description: "Nouveau titre de l'événement" })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  titre?: string;

  @ApiPropertyOptional({ description: 'Nouvelle description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Identifiant du dossier lié' })
  @IsOptional()
  @IsString()
  dossierId?: string;

  @ApiPropertyOptional({ description: 'Nouvelle date de début (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  debut?: Date;

  @ApiPropertyOptional({ description: 'Nouvelle date de fin (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  fin?: Date;

  @ApiPropertyOptional({
    enum: StatutEvenement,
    description: "Statut de l'événement",
  })
  @IsOptional()
  @IsEnum(StatutEvenement)
  statut?: StatutEvenement;
}
