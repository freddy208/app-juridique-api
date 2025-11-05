import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  MinLength,
} from 'class-validator';
import { RoleUtilisateur } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ description: "Prénom de l'utilisateur", example: 'Jean' })
  @IsNotEmpty()
  @IsString()
  prenom: string;

  @ApiProperty({ description: "Nom de l'utilisateur", example: 'Dupont' })
  @IsNotEmpty()
  @IsString()
  nom: string;

  @ApiProperty({
    description: "Email de l'utilisateur",
    example: 'jean.dupont@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Mot de passe', example: 'Password123!' })
  @IsNotEmpty()
  @MinLength(8)
  motDePasse: string;

  @ApiProperty({
    description: 'Téléphone',
    example: '+237 699 123 456',
    required: false,
  })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({
    description: 'Adresse',
    example: 'Yaoundé, Cameroun',
    required: false,
  })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiProperty({
    description: 'Spécialité juridique',
    example: 'Droit des affaires',
    required: false,
  })
  @IsOptional()
  @IsString()
  specialite?: string;

  @ApiProperty({
    description: "Barreau d'inscription",
    example: 'Barreau de Yaoundé',
    required: false,
  })
  @IsOptional()
  @IsString()
  barreau?: string;

  @ApiProperty({
    description: 'Numéro de permis',
    example: '12345/ABC',
    required: false,
  })
  @IsOptional()
  @IsString()
  numeroPermis?: string;

  @ApiProperty({
    description: "Rôle de l'utilisateur",
    enum: RoleUtilisateur,
    example: RoleUtilisateur.AVOCAT,
  })
  @IsEnum(RoleUtilisateur)
  role: RoleUtilisateur;
}
