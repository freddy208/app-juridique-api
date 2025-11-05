// dto/create-document.dto.ts
import { IsString, IsOptional, IsEnum, IsInt, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutDocument } from '@prisma/client';

export class CreateDocumentDto {
  @ApiProperty({ description: 'ID du dossier associé' })
  @IsUUID()
  dossierId: string;

  @ApiProperty({ description: 'Titre du document' })
  @IsString()
  titre: string;

  @ApiProperty({ description: 'Type de document' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'Taille du fichier en bytes' })
  @IsOptional()
  @IsInt()
  taille?: number;

  @ApiPropertyOptional({ description: 'Extension du fichier' })
  @IsOptional()
  @IsString()
  extension?: string;

  @ApiPropertyOptional({
    description: 'Statut du document',
    enum: StatutDocument,
    default: StatutDocument.ACTIF,
  })
  @IsOptional()
  @IsEnum(StatutDocument)
  statut?: StatutDocument = StatutDocument.ACTIF;
}
