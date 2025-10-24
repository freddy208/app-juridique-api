// ============================================
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatutUtilisateur } from '@prisma/client';

export class ChangeStatusDto {
  @ApiProperty({
    enum: StatutUtilisateur,
    example: StatutUtilisateur.SUSPENDU,
    description: "Nouveau statut de l'utilisateur",
  })
  @IsEnum(StatutUtilisateur, { message: 'Statut invalide' })
  statut: StatutUtilisateur;

  @ApiProperty({
    example: 'Non-respect du règlement intérieur',
    required: false,
    description:
      'Raison du changement de statut (recommandé pour suspension/inactivation)',
  })
  @IsString()
  @MaxLength(500, { message: 'La raison ne peut pas dépasser 500 caractères' })
  @IsOptional()
  raison?: string;
}
