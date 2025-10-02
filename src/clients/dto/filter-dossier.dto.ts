// src/clients/dto/filter-dossier.dto.ts
import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutDossier } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterDossierDto {
  @IsOptional()
  @IsEnum(StatutDossier)
  statutDossier?: StatutDossier;

  @ApiPropertyOptional({ description: 'Pagination - skip', example: 0 })
  @Type(() => Number)
  @IsNumber()
  skip = 0;

  @ApiPropertyOptional({ description: 'Pagination - take', example: 10 })
  @Type(() => Number)
  @IsNumber()
  take = 10;
}
