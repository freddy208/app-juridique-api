import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ description: 'Contenu de la note' })
  @IsNotEmpty()
  @IsString()
  contenu: string;

  @ApiProperty({ description: 'ID du dossier associé', required: false })
  @IsOptional()
  @IsString()
  dossierId?: string;
}
