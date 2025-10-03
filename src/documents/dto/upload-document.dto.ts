// src/documents/dto/upload-document.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({ description: 'ID du dossier auquel appartient le document' })
  @IsNotEmpty()
  @IsString()
  dossierId: string;

  @ApiProperty({ description: 'Titre du document (ex: Contrat de bail)' })
  @IsNotEmpty()
  @IsString()
  titre: string;

  @ApiProperty({ description: 'Type du document (ex: PDF, Word, Image...)' })
  @IsNotEmpty()
  @IsString()
  type: string;
}
