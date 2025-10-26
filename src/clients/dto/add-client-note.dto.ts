// dto/add-client-note.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class AddClientNoteDto {
  @ApiProperty({
    description: 'Titre de la note',
    example: 'Appel téléphonique du 25/10/2024',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titre: string;

  @ApiProperty({
    description: 'Contenu de la note',
    example: 'Client souhaite des informations sur la procédure...',
  })
  @IsString()
  @IsNotEmpty()
  contenu: string;

  @ApiProperty({
    description: 'Note importante (prioritaire)',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  importante?: boolean;
}
