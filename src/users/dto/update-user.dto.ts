// ============================================
// update-user.dto.ts
// ============================================
import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  Matches,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RoleUtilisateur, StatutUtilisateur } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({ example: 'Jean', required: false })
  @IsString()
  @IsOptional()
  prenom?: string;

  @ApiProperty({ example: 'Dupont', required: false })
  @IsString()
  @IsOptional()
  nom?: string;

  @ApiProperty({ example: 'jean.dupont@cabinet.com', required: false })
  @IsEmail({}, { message: "Format d'email invalide" })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'NewStrongP@ss123',
    required: false,
    description:
      'Minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 symbole',
  })
  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un symbole',
  })
  @IsOptional()
  motDePasse?: string;

  @ApiProperty({ enum: RoleUtilisateur, required: false })
  @IsEnum(RoleUtilisateur)
  @IsOptional()
  role?: RoleUtilisateur;

  @ApiProperty({ enum: StatutUtilisateur, required: false })
  @IsEnum(StatutUtilisateur)
  @IsOptional()
  statut?: StatutUtilisateur;

  @ApiProperty({ example: '+237612345678', required: false })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message:
      'Format de téléphone invalide (utilisez le format international: +237...)',
  })
  @IsOptional()
  telephone?: string;

  @ApiProperty({ example: 'Douala, Cameroun', required: false })
  @IsString()
  @IsOptional()
  adresse?: string;

  @ApiProperty({ example: 'Droit des affaires', required: false })
  @IsString()
  @IsOptional()
  specialite?: string;

  @ApiProperty({ example: 'Barreau de Douala', required: false })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((o) => o.role === RoleUtilisateur.AVOCAT)
  @IsNotEmpty({ message: 'Le barreau est requis pour les avocats' })
  @IsString()
  @IsOptional()
  barreau?: string;

  @ApiProperty({ example: 'AV123456', required: false })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((o) => o.role === RoleUtilisateur.AVOCAT)
  @IsNotEmpty({ message: 'Le numéro de permis est requis pour les avocats' })
  @IsString()
  @IsOptional()
  numeroPermis?: string;
}
