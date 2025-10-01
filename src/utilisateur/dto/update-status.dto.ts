// src/utilisateurs/dto/update-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({ enum: ['ACTIF', 'INACTIF'], description: 'Nouveau statut' })
  @IsIn(['ACTIF', 'INACTIF'])
  statut: 'ACTIF' | 'INACTIF';
}
