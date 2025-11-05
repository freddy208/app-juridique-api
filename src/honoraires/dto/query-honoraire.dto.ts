/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TypeHonoraire, StatutHonoraire } from '@prisma/client';

export class QueryHonoraireDto {
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
  @IsString()
  sortBy?: string = 'dateEmission';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  dossierId?: string;

  @IsOptional()
  @IsEnum(StatutHonoraire)
  statut?: StatutHonoraire;

  @IsOptional()
  @IsEnum(TypeHonoraire)
  typeHonoraire?: TypeHonoraire;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  dateMin?: Date;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  dateMax?: Date;
}
