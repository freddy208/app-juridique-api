import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';
import { RoleUtilisateur, StatutUtilisateur } from '@prisma/client';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  prenom?: string;

  @IsString()
  @IsOptional()
  nom?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  motDePasse?: string;

  @IsEnum(RoleUtilisateur)
  @IsOptional()
  role?: RoleUtilisateur;

  @IsEnum(StatutUtilisateur)
  @IsOptional()
  statut?: StatutUtilisateur;

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
