// src/messages/dto/filter-message.dto.ts
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
import { StatutMessage } from '@prisma/client';

export class FilterMessageDto {
  @ApiPropertyOptional({ description: 'Filtrer par ID du dossier' })
  @IsOptional()
  @IsUUID()
  dossierId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par ID de l’expéditeur' })
  @IsOptional()
  @IsUUID()
  expediteurId?: string;

  @ApiPropertyOptional({
    enum: StatutMessage,
    description: 'Filtrer par statut du message',
  })
  @IsOptional()
  @IsEnum(StatutMessage)
  statut?: StatutMessage;

  @ApiPropertyOptional({ description: 'Rechercher dans le contenu du message' })
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
