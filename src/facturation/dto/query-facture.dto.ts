import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatutFacture } from '@prisma/client';

export class QueryFactureDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  sortBy?: string = 'dateEmission';

  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  dossierId?: string;

  @IsOptional()
  @IsEnum(StatutFacture)
  statut?: StatutFacture;

  @IsOptional()
  @IsDateString()
  dateMin?: string;

  @IsOptional()
  @IsDateString()
  dateMax?: string;
}
