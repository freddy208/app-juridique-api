import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';
import { RoleUtilisateur, StatutUtilisateur } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  prenom: string;

  @IsString()
  nom: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  motDePasse: string;

  @IsEnum(RoleUtilisateur)
  role: RoleUtilisateur;

  @IsEnum(StatutUtilisateur)
  @IsOptional()
  statut?: StatutUtilisateur = StatutUtilisateur.ACTIF;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  specialite?: string;

  @IsString()
  @IsOptional()
  barreau?: string;

  @IsString()
  @IsOptional()
  numeroPermis?: string;
}
