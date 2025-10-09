// src/taches/dto/update-status-tache.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatutTache } from '@prisma/client';

export class UpdateStatusTacheDto {
  @ApiProperty({
    enum: ['A_FAIRE', 'EN_COURS', 'TERMINEE'],
    description: 'Nouveau statut de la tâche',
  })
  @IsEnum(['A_FAIRE', 'EN_COURS', 'TERMINEE'])
  statut: StatutTache;
}
