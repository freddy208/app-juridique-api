import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator';

export class CreateDiscussionDto {
  @ApiProperty({ description: 'Titre de la discussion', required: false })
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiProperty({ description: 'ID du dossier associé', required: false })
  @IsOptional()
  @IsUUID()
  dossierId?: string;

  @ApiProperty({
    description: 'IDs des participants à ajouter à la discussion',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  participantsIds?: string[];

  @ApiProperty({
    description: 'Message initial de la discussion',
    required: false,
  })
  @IsOptional()
  @IsString()
  messageInitial?: string;
}
