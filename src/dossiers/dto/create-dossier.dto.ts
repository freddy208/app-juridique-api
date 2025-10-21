// src/dossiers/dto/create-dossier.dto.ts
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TypeDossier, StatutDossier } from '@prisma/client';

export class CreateDossierDto {
  @IsString()
  titre: string;

  @IsEnum(TypeDossier)
  type: TypeDossier;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  clientId: string;

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
