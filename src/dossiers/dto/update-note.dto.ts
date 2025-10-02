import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateNoteDto {
  @IsString()
  @IsNotEmpty()
  contenu: string;
}
