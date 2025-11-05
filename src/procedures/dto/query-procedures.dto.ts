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
import { TypeProcedure, StatutProcedure } from '@prisma/client';

export class QueryProceduresDto {
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

  @ApiProperty({ description: 'ID du dossier', required: false })
  @IsOptional()
  @IsUUID()
  dossierId?: string;

  @ApiProperty({
    description: 'Type de procédure',
    enum: TypeProcedure,
    required: false,
  })
  @IsOptional()
  @IsEnum(TypeProcedure)
  typeProcedure?: TypeProcedure;

  @ApiProperty({ description: 'Juridiction', required: false })
  @IsOptional()
  @IsString()
  juridiction?: string;

  @ApiProperty({
    description: 'Statut de la procédure',
    enum: StatutProcedure,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutProcedure)
  statut?: StatutProcedure;

  @ApiProperty({ description: 'Terme de recherche', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: "Date d'introduction minimale", required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateIntroductionMin?: Date;

  @ApiProperty({ description: "Date d'introduction maximale", required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateIntroductionMax?: Date;

  @ApiProperty({
    description: 'Inclure uniquement les procédures avec des audiences à venir',
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  avecAudiencesAVenir?: boolean;

  @ApiProperty({
    description: 'Inclure uniquement les procédures avec des échéances proches',
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  avecEcheancesProches?: boolean;
}
