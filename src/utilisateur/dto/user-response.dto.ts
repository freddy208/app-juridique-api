// src/utilisateurs/dto/user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { RoleUtilisateur, StatutUtilisateur } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  prenom: string;

  @ApiProperty()
  nom: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: RoleUtilisateur })
  role: RoleUtilisateur;

  @ApiProperty({ enum: StatutUtilisateur })
  statut: StatutUtilisateur;

  @ApiProperty()
  creeLe: Date;

  @ApiProperty()
  modifieLe: Date;
}
