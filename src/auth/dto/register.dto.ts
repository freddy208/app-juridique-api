// register.dto.ts
import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { RoleUtilisateur } from '../../enums/role-utilisateur.enum';

export class RegisterDto {
  @IsNotEmpty()
  prenom: string;

  @IsNotEmpty()
  nom: string;

  @IsEmail()
  email: string;

  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  motDePasse: string;

  @IsEnum(RoleUtilisateur, { message: 'Rôle invalide' })
  role: RoleUtilisateur;
}
