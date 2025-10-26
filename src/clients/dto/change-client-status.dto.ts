// dto/change-client-status.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatutClient } from '@prisma/client';

export class ChangeClientStatusDto {
  @ApiProperty({
    description: 'Nouveau statut du client',
    enum: StatutClient,
    example: StatutClient.INACTIF,
  })
  @IsEnum(StatutClient, {
    message: 'Le statut doit être ACTIF, INACTIF, POTENTIEL ou ARCHIVE',
  })
  statut: StatutClient;

  @ApiProperty({
    description: 'Raison du changement de statut',
    example: 'Client sans activité depuis 12 mois',
    required: false,
  })
  @IsOptional()
  @IsString()
  raison?: string;
}
