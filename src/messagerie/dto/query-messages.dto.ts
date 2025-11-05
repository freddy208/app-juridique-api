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
import { StatutMessage } from '@prisma/client';

export class QueryMessagesDto {
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
    default: 'creeLe',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'creeLe';

  @ApiProperty({ description: 'Ordre de tri', required: false, default: 'asc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiProperty({ description: 'ID de la discussion', required: false })
  @IsOptional()
  @IsUUID()
  discussionId?: string;

  @ApiProperty({ description: "ID de l'expéditeur", required: false })
  @IsOptional()
  @IsUUID()
  expediteurId?: string;

  @ApiProperty({
    description: 'Statut du message',
    enum: StatutMessage,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutMessage)
  statut?: StatutMessage;

  @ApiProperty({ description: 'Date de création minimale', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateMin?: Date;

  @ApiProperty({ description: 'Date de création maximale', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateMax?: Date;

  @ApiProperty({ description: 'Terme de recherche', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Inclure uniquement les messages non lus',
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  nonLusSeulement?: boolean;
}
