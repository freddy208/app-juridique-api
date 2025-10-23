import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RoleUtilisateur, StatutUtilisateur } from '@prisma/client';

export class FilterUsersDto {
  @IsEnum(RoleUtilisateur)
  @IsOptional()
  role?: RoleUtilisateur;

  @IsEnum(StatutUtilisateur)
  @IsOptional()
  statut?: StatutUtilisateur;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  specialite?: string;

  @IsString()
  @IsOptional()
  barreau?: string;
}
