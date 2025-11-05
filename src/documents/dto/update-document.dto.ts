// dto/update-document.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateDocumentDto } from './create-document.dto';
import { IsOptional, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatutDocument } from '@prisma/client';

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {
  @ApiPropertyOptional({ description: 'Version du document' })
  @IsOptional()
  @IsInt()
  version?: number;

  @ApiPropertyOptional({
    description: 'Statut du document',
    enum: StatutDocument,
  })
  @IsOptional()
  override statut?: StatutDocument;

  @ApiPropertyOptional({ description: 'Contenu OCR du document' })
  @IsOptional()
  contenuOCR?: string;

  @ApiPropertyOptional({
    description: 'Indique si le document est indexé par OCR',
  })
  @IsOptional()
  indexeOCR?: boolean;
}
