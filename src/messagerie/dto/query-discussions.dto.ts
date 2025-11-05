import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatutDiscussion } from '@prisma/client';

export class QueryDiscussionsDto {
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
    default: 'modifieLe',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'modifieLe';

  @ApiProperty({
    description: 'Ordre de tri',
    required: false,
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ description: 'ID du créateur', required: false })
  @IsOptional()
  @IsUUID()
  createurId?: string;

  @ApiProperty({ description: 'ID du dossier', required: false })
  @IsOptional()
  @IsUUID()
  dossierId?: string;

  @ApiProperty({ description: "ID d'un participant", required: false })
  @IsOptional()
  @IsUUID()
  participantId?: string;

  @ApiProperty({
    description: 'Statut de la discussion',
    enum: StatutDiscussion,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutDiscussion)
  statut?: StatutDiscussion;

  @ApiProperty({ description: 'Terme de recherche', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Inclure uniquement les discussions non lues',
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  nonLuesSeulement?: boolean;

  @ApiProperty({
    description: 'Inclure uniquement les discussions avec des messages non lus',
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  avecMessagesNonLus?: boolean;
}
