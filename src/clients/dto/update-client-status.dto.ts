// src/clients/dto/update-client-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatutClient } from '@prisma/client';

export class UpdateClientStatusDto {
  @ApiProperty({ enum: StatutClient, description: 'Statut du client' })
  @IsEnum(StatutClient)
  statut: StatutClient;
}
