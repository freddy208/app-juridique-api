import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutDocument } from '@prisma/client';

export class FilterDocumentDto {
  @ApiPropertyOptional({ description: 'Filtrer par ID de dossier' })
  @IsOptional()
  @IsString()
  dossierId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par ID de client' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par type de document' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    enum: StatutDocument,
    description: 'Filtrer par statut du document',
  })
  @IsOptional()
  @IsEnum(StatutDocument)
  statut?: StatutDocument;

  @ApiPropertyOptional({ description: 'Pagination - skip' })
  @Type(() => Number)
  @IsNumber()
  skip = 0;

  @ApiPropertyOptional({ description: 'Pagination - take' })
  @Type(() => Number)
  @IsNumber()
  take = 10;
}
