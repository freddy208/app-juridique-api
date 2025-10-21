// src/dossiers/dto/update-dossier.dto.ts
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TypeDossier, StatutDossier } from '@prisma/client';

export class UpdateDossierDto {
  @IsOptional()
  @IsString()
  titre?: string;

  @IsOptional()
  @IsEnum(TypeDossier)
  type?: TypeDossier;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  clientId?: string;

  @IsOptional()
  @IsString()
  responsableId?: string;

  @IsOptional()
  @IsEnum(StatutDossier)
  statut?: StatutDossier;

  @IsOptional()
  detailsSpecifiques?: Record<string, any>;

  @IsOptional()
  documents?: Express.Multer.File[];

  @IsOptional()
  taches?: Array<{
    titre: string;
    description?: string;
    assigneeId?: string;
    priorite?: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE';
    dateLimite?: Date;
  }>;

  @IsOptional()
  utilisateurId?: string;
}
