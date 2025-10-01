import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';
import { RoleUtilisateur, StatutUtilisateur } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Jean', description: 'Prénom du collaborateur' })
  @IsNotEmpty()
  prenom: string;

  @ApiProperty({ example: 'Dupont', description: 'Nom du collaborateur' })
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    example: 'jean.dupont@example.com',
    description: 'Email unique du collaborateur',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Mot de passe du collaborateur',
  })
  @MinLength(6)
  motDePasse: string;

  @ApiProperty({ enum: RoleUtilisateur, example: RoleUtilisateur.ASSISTANT })
  @IsOptional()
  @IsEnum(RoleUtilisateur)
  role?: RoleUtilisateur;

  @ApiProperty({ enum: StatutUtilisateur, example: StatutUtilisateur.ACTIF })
  @IsOptional()
  @IsEnum(StatutUtilisateur)
  statut?: StatutUtilisateur;
}
