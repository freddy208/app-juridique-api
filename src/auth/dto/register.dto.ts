import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleUtilisateur } from '../../enums/role-utilisateur.enum';

export class RegisterDto {
  @ApiProperty({
    example: 'John',
    description: "Le prénom de l'utilisateur",
  })
  @IsNotEmpty()
  prenom: string;

  @ApiProperty({
    example: 'Doe',
    description: "Le nom de famille de l'utilisateur",
  })
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    example: 'newuser@test.com',
    description: "L'email de l'utilisateur",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: "Le mot de passe de l'utilisateur (min 6 caractères)",
  })
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  motDePasse: string;

  @ApiProperty({
    example: RoleUtilisateur.STAGIAIRE,
    enum: RoleUtilisateur,
    description: 'Le rôle de l’utilisateur',
  })
  @IsEnum(RoleUtilisateur, { message: 'Rôle invalide' })
  role: RoleUtilisateur;
}
