import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { TypeNotification } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({
    description: "ID de l'utilisateur destinataire",
    example: 'uuid',
  })
  @IsNotEmpty()
  @IsString()
  utilisateurId: string;

  @ApiProperty({
    description: 'Titre de la notification',
    example: 'Nouveau dossier assigné',
  })
  @IsNotEmpty()
  @IsString()
  titre: string;

  @ApiProperty({
    description: 'Message de la notification',
    example: 'Le dossier D-2023-001 vous a été assigné',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Type de notification',
    enum: TypeNotification,
    example: TypeNotification.INFO,
  })
  @IsEnum(TypeNotification)
  type: TypeNotification;

  @ApiProperty({
    description: 'Lien vers la ressource associée',
    required: false,
  })
  @IsOptional()
  @IsString()
  lien?: string;
}
