import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateClientNoteDto {
  @ApiProperty({ description: 'Nouveau contenu de la note' })
  @IsNotEmpty()
  @IsString()
  contenu: string;
}
