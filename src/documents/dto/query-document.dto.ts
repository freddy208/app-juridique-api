// dto/query-document.dto.ts
import { IsOptional, IsString, IsEnum, IsInt, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatutDocument } from '@prisma/client';

export class QueryDocumentDto {
  @ApiPropertyOptional({
    description: 'Numéro de page pour la pagination',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Nombre d'éléments par page",
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Champ de tri', default: 'creeLe' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'creeLe';

  @ApiPropertyOptional({ description: 'Ordre de tri', default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'ID du dossier pour filtrer' })
  @IsOptional()
  @IsUUID()
  dossierId?: string;

  @ApiPropertyOptional({ description: "ID de l'utilisateur pour filtrer" })
  @IsOptional()
  @IsUUID()
  televersePar?: string;

  @ApiPropertyOptional({ description: 'Type de document pour filtrer' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Statut du document pour filtrer',
    enum: StatutDocument,
  })
  @IsOptional()
  @IsEnum(StatutDocument)
  statut?: StatutDocument;

  @ApiPropertyOptional({ description: 'Terme de recherche dans le titre' })
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiPropertyOptional({
    description: 'Terme de recherche dans le contenu OCR',
  })
  @IsOptional()
  @IsString()
  recherche?: string;
}
