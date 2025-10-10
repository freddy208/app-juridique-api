import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Contenu du message',
    example: 'Bonjour Maître, le dossier est prêt.',
  })
  @IsNotEmpty()
  @IsString()
  contenu: string;

  @ApiProperty({
    description: "ID de l'expéditeur (Utilisateur)",
    example: 'e6a02f4c-9e85-4d4a-9a24-3f9c2c1eab3c',
  })
  @IsNotEmpty()
  @IsUUID()
  expediteurId: string;

  @ApiProperty({
    description: 'ID du dossier concerné (facultatif)',
    example: '4b24307e-ccaa-4b7d-8af5-602c0f1fd37e',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  dossierId?: string;
}
