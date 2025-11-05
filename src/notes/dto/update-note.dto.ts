import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateNoteDto {
  @ApiProperty({ description: 'Titre de la note', required: false })
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiProperty({ description: 'Contenu de la note', required: false })
  @IsOptional()
  @IsString()
  contenu?: string;

  @ApiProperty({ description: 'ID du client (optionnel)', required: false })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({ description: 'ID du dossier (optionnel)', required: false })
  @IsOptional()
  @IsUUID()
  dossierId?: string;

  @ApiProperty({ description: 'Statut de la note', required: false })
  @IsOptional()
  @IsString()
  statut?: string;
}
