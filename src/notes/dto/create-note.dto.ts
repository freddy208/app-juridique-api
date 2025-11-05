import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ description: 'Titre de la note', required: false })
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiProperty({
    description: 'Contenu de la note',
    example: 'Note importante sur le dossier',
  })
  @IsNotEmpty()
  @IsString()
  contenu: string;

  @ApiProperty({ description: 'ID du client (optionnel)', required: false })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({ description: 'ID du dossier (optionnel)', required: false })
  @IsOptional()
  @IsUUID()
  dossierId?: string;
}
