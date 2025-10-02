// src/dossiers/dto/assign-dossier.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignDossierDto {
  @ApiProperty({
    description: 'ID du nouveau responsable du dossier',
    example: 'a3f2c8d0-1e4f-4a9b-93b6-4e0a6e7c8f90', // ✅ exemple concret UUID
  })
  @IsNotEmpty()
  @IsString()
  nouveauResponsableId: string;
}
