// src/documents/dto/document.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { StatutDocument } from '@prisma/client';

export class DocumentDto {
  @ApiProperty({
    description: 'Identifiant unique du document',
    example: 'b3a1f2d4-1234-5678-90ab-cdef12345678',
  })
  id: string;

  @ApiProperty({
    description: 'Identifiant du dossier associé',
    example: 'd4c3b2a1-9876-5432-10fe-dcba87654321',
  })
  dossierId: string;

  @ApiProperty({
    description: 'Identifiant de l’utilisateur qui a téléversé le document',
    example: 'u1a2b3c4-5678-9101-1121-314151617181',
  })
  televersePar: string;

  @ApiProperty({ description: 'Titre du document', example: 'Contrat de bail' })
  titre: string;

  @ApiProperty({ description: 'Type du document', example: 'CONTRAT' })
  type: string;

  @ApiProperty({
    description: 'URL du document stocké',
    example: 'https://storage.example.com/docs/contrat.pdf',
  })
  url: string;

  @ApiProperty({ description: 'Version du document', example: 1 })
  version: number;

  @ApiProperty({
    description: 'Statut du document',
    enum: StatutDocument,
    example: StatutDocument.ACTIF,
  })
  statut: StatutDocument;

  @ApiProperty({
    description: 'Date de création du document',
    example: '2025-10-03T03:30:00.000Z',
  })
  creeLe: Date;

  @ApiProperty({
    description: 'Date de dernière modification du document',
    example: '2025-10-03T03:45:00.000Z',
  })
  modifieLe: Date;
}
