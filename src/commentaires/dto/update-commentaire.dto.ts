import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCommentaireDto {
  @ApiProperty({ description: 'Contenu du commentaire', required: false })
  @IsOptional()
  @IsString()
  contenu?: string;

  @ApiProperty({ description: 'Statut du commentaire', required: false })
  @IsOptional()
  @IsString()
  statut?: string;
}
