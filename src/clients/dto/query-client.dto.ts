/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { TypeClient, StatutClient } from '@prisma/client';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryClientDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'creeLe';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TypeClient)
  typeClient?: TypeClient;

  @IsOptional()
  @IsEnum(StatutClient)
  statut?: StatutClient;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  pays?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  estVIP?: boolean;
}
