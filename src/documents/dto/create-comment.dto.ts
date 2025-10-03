// src/documents/dto/create-comment.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Contenu du commentaire',
    example: 'Ceci est un commentaire interne sur le document',
  })
  @IsNotEmpty()
  @IsString()
  contenu: string;
}
