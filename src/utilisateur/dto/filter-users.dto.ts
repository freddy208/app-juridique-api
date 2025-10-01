import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoleUtilisateur, StatutUtilisateur } from '@prisma/client';

export class FilterUsersDto {
  @ApiPropertyOptional({
    enum: RoleUtilisateur,
    description: 'Filtrer par rôle',
  })
  @IsOptional()
  @IsEnum(RoleUtilisateur)
  role?: RoleUtilisateur;

  @ApiPropertyOptional({
    enum: StatutUtilisateur,
    description: 'Filtrer par statut',
  })
  @IsOptional()
  @IsEnum(StatutUtilisateur)
  statut?: StatutUtilisateur;
}
