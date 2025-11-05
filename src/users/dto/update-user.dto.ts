import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsEnum } from 'class-validator';
import { RoleUtilisateur, StatutUtilisateur } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({
    description: "Prénom de l'utilisateur",
    example: 'Jean',
    required: false,
  })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiProperty({
    description: "Nom de l'utilisateur",
    example: 'Dupont',
    required: false,
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty({
    description: "Email de l'utilisateur",
    example: 'jean.dupont@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

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
    required: false,
  })
  @IsOptional()
  @IsEnum(RoleUtilisateur)
  role?: RoleUtilisateur;

  @ApiProperty({
    description: "Statut de l'utilisateur",
    enum: StatutUtilisateur,
    example: StatutUtilisateur.ACTIF,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutUtilisateur)
  statut?: StatutUtilisateur;
}
