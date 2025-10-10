// src/evenements/dto/create-evenement.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateEvenementDto {
  @ApiProperty({
    example: 'Réunion client',
    description: 'Titre de l’événement',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  titre: string;

  @ApiProperty({ example: 'Préparation dossier Racing 237', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '2025-10-15T08:00:00Z',
    description: 'Date et heure de début',
  })
  @IsDateString()
  debut: string;

  @ApiProperty({
    example: '2025-10-15T10:00:00Z',
    description: 'Date et heure de fin',
  })
  @IsDateString()
  fin: string;

  @ApiProperty({
    example: 'b2d7fa90-7c3a-43b2-a620-7f51614c8a0b',
    required: false,
    description: 'Identifiant du dossier associé (facultatif)',
  })
  @IsOptional()
  @IsUUID()
  dossierId?: string;
}
