// src/dossiers/dto/update-specific-details.dto.ts
import { IsEnum, IsObject } from 'class-validator';
import { TypeDossier } from '@prisma/client';

export class UpdateSpecificDetailsDto {
  @IsEnum(TypeDossier)
  type: TypeDossier;

  @IsObject()
  detailsSpecifiques: Record<string, any>;
}
