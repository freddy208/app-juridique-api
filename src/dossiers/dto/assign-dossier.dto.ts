// src/dossiers/dto/assign-dossier.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignDossierDto {
  @IsNotEmpty()
  @IsString()
  nouveauResponsableId: string;
}
