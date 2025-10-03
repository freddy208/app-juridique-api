// src/documents/dto/update-comment.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiPropertyOptional({ description: 'Nouveau contenu du commentaire' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  contenu?: string;
}
