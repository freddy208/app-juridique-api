import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatutUtilisateur } from '@prisma/client';

export class ChangeStatusDto {
  @IsEnum(StatutUtilisateur)
  statut: StatutUtilisateur;

  @IsString()
  @IsOptional()
  raison?: string;
}
