import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { RoleUtilisateur } from '@prisma/client';

export class RegisterDto {
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
  @IsOptional()
  role?: RoleUtilisateur;
}
