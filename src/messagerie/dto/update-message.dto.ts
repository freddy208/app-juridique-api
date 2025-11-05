import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { StatutMessage } from '@prisma/client';

export class UpdateMessageDto {
  @ApiProperty({ description: 'Contenu du message', required: false })
  @IsOptional()
  @IsString()
  contenu?: string;

  @ApiProperty({
    description: 'Statut du message',
    enum: StatutMessage,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutMessage)
  statut?: StatutMessage;
}
