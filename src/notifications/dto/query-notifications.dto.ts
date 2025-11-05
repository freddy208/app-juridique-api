import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeNotification } from '@prisma/client';

export class QueryNotificationsDto {
  @ApiProperty({ description: 'Filtrer par utilisateur', required: false })
  @IsOptional()
  @IsString()
  utilisateurId?: string;

  @ApiProperty({
    description: 'Filtrer par type',
    enum: TypeNotification,
    required: false,
  })
  @IsOptional()
  @IsEnum(TypeNotification)
  type?: TypeNotification;

  @ApiProperty({
    description: 'Filtrer par statut de lecture',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  lu?: boolean;

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
