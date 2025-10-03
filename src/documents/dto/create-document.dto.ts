// src/documents/dto/create-document.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'ID du dossier auquel le document est associé',
    example: 'd4c3b2a1-9876-5432-10fe-dcba87654321',
  })
  @IsNotEmpty()
  @IsString()
  dossierId: string;

  @ApiProperty({ description: 'Titre du document', example: 'Contrat de bail' })
  @IsNotEmpty()
  @IsString()
  titre: string;

  @ApiProperty({ description: 'Type du document', example: 'CONTRAT' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({
    description: 'ID de l’utilisateur qui téléverse le document',
    example: 'u1a2b3c4-5678-9101-1121-314151617181',
  })
  @IsNotEmpty()
  @IsString()
  televersePar: string;

  @ApiProperty({
    description: 'URL ou chemin du fichier uploadé',
    example: 'uploads/contrat.pdf',
  })
  @IsNotEmpty()
  @IsString()
  url: string;

  @ApiProperty({
    description: 'Version du document',
    example: 1,
    required: false,
  })
  @IsOptional()
  version?: number;

  @ApiProperty({
    description: 'Statut du document',
    example: 'ACTIF',
    required: false,
  })
  @IsOptional()
  statut?: 'ACTIF' | 'ARCHIVE' | 'SUPPRIME';
}
