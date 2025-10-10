// src/messages/dto/update-message.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatutMessage } from '@prisma/client';

export class UpdateMessageDto {
  @ApiPropertyOptional({ description: 'Contenu du message (texte modifié)' })
  @IsOptional()
  @IsString()
  contenu?: string;

  @ApiPropertyOptional({
    description: 'Statut du message (ENVOYE, LU)',
    enum: StatutMessage,
  })
  @IsOptional()
  @IsEnum(StatutMessage)
  statut?: StatutMessage;
}
