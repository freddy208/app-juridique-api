import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, IsString, IsEnum } from 'class-validator';
import { TypeNotification } from '@prisma/client';

export class BulkNotificationDto {
  @ApiProperty({
    description: 'IDs des utilisateurs destinataires',
    example: ['uuid1', 'uuid2'],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  utilisateurIds: string[];

  @ApiProperty({
    description: 'Titre de la notification',
    example: 'Maintenance système',
  })
  @IsNotEmpty()
  @IsString()
  titre: string;

  @ApiProperty({
    description: 'Message de la notification',
    example: 'Le système sera en maintenance ce soir à 22h',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Type de notification',
    enum: TypeNotification,
    example: TypeNotification.ALERTE,
  })
  @IsEnum(TypeNotification)
  type: TypeNotification;

  @ApiProperty({
    description: 'Lien vers la ressource associée',
    required: false,
  })
  @IsString()
  lien?: string;
}
