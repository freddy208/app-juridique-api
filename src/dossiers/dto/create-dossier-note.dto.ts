import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDossierNoteDto {
  @ApiProperty({
    example: 'Discussion avec le client concernant le dossier X',
    description: 'Contenu de la note ajoutée par un utilisateur',
  })
  @IsString()
  @IsNotEmpty()
  contenu: string;
}
