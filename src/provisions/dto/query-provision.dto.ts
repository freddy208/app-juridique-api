import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatutProvision } from '@prisma/client';

export class QueryProvisionDto {
  @ApiProperty({ description: 'Numéro de page', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: "Nombre d'éléments par page", required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiProperty({ description: 'Champ de tri', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string = 'dateProvision';

  @ApiProperty({
    description: 'Ordre de tri',
    required: false,
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ description: 'ID du client', required: false })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: 'ID du dossier', required: false })
  @IsOptional()
  @IsString()
  dossierId?: string;

  @ApiProperty({
    description: 'Statut de la provision',
    enum: StatutProvision,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutProvision)
  statut?: StatutProvision;

  @ApiProperty({ description: 'Date minimale', required: false })
  @IsOptional()
  @IsDateString()
  dateMin?: string;

  @ApiProperty({ description: 'Date maximale', required: false })
  @IsOptional()
  @IsDateString()
  dateMax?: string;
}
