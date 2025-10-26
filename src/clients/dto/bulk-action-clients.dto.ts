// dto/bulk-action-clients.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ArrayMinSize,
} from 'class-validator';
import { StatutClient } from '@prisma/client';

export enum BulkActionType {
  CHANGE_STATUS = 'CHANGE_STATUS',
  SET_VIP = 'SET_VIP',
  REMOVE_VIP = 'REMOVE_VIP',
  ARCHIVE = 'ARCHIVE',
  EXPORT = 'EXPORT',
  DELETE = 'DELETE',
}

export class BulkActionClientsDto {
  @ApiProperty({
    description: 'Liste des IDs des clients',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'Au moins un client doit être sélectionné',
  })
  @IsString({ each: true })
  clientIds: string[];

  @ApiProperty({
    description: "Type d'action à effectuer",
    enum: BulkActionType,
    example: BulkActionType.CHANGE_STATUS,
  })
  @IsEnum(BulkActionType, {
    message: "Type d'action invalide",
  })
  @IsNotEmpty()
  action: BulkActionType;

  @ApiProperty({
    description: 'Nouveau statut (requis pour CHANGE_STATUS)',
    enum: StatutClient,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutClient)
  newStatus?: StatutClient;

  @ApiProperty({
    description: "Raison de l'action",
    example: 'Clients inactifs depuis plus de 12 mois',
    required: false,
  })
  @IsOptional()
  @IsString()
  raison?: string;
}
