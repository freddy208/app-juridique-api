// src/documents/dto/update-document-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatutDocument } from '@prisma/client';

export class UpdateDocumentStatusDto {
  @ApiProperty({
    description: 'Nouveau statut du document',
    enum: StatutDocument,
    example: StatutDocument.ARCHIVE,
  })
  @IsEnum(StatutDocument)
  statut: StatutDocument;
}
