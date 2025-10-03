// src/documents/dto/update-document.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateDocumentDto {
  @ApiPropertyOptional({ description: 'Nouveau titre du document' })
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiPropertyOptional({
    description: 'Nouveau type du document (ex: PDF, WORD, IMAGE)',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Déplacer le document vers un autre dossier (ID du dossier)',
  })
  @IsOptional()
  @IsString()
  dossierId?: string;

  // Si tu veux autoriser la modification du statut via cet endpoint,
  // tu peux ajouter un champ statut ici (avec IsEnum(StatutDocument)).
  // Je l'ai volontairement laissé hors de ce DTO pour préférer un endpoint dédié
  // de changement de statut (PATCH /documents/:id/status).
}
