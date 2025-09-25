// register.dto.ts
import { IsEmail, IsString, IsOptional } from 'class-validator';
import { RoleUtilisateur } from '../../enums/role-utilisateur.enum';

export class RegisterDto {
  @IsString()
  prenom: string;

  @IsString()
  nom: string;

  @IsEmail()
  email: string;

  @IsString()
  motDePasse: string;

  @IsOptional()
  role?: RoleUtilisateur;
}
