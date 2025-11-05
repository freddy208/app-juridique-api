import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentaireDto {
  @ApiProperty({ description: 'Contenu du commentaire' })
  @IsNotEmpty()
  @IsString()
  contenu: string;

  @ApiProperty({ description: 'ID du document (optionnel)', required: false })
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @ApiProperty({ description: 'ID de la tâche (optionnel)', required: false })
  @IsOptional()
  @IsUUID()
  tacheId?: string;
}
