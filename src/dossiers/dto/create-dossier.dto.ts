// src/dossiers/dto/create-dossier.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsEnum, IsString } from 'class-validator';
import { TypeDossier, StatutDossier } from '@prisma/client';

export class CreateDossierDto {
  @ApiProperty({ description: 'Titre du dossier' })
  @IsNotEmpty()
  @IsString()
  titre: string;

  @ApiProperty({ description: 'Type du dossier', enum: TypeDossier })
  @IsEnum(TypeDossier)
  type: TypeDossier;

  @ApiProperty({ description: 'Description du dossier', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID du client associé' })
  @IsNotEmpty()
  @IsString()
  clientId: string;

  @ApiProperty({ description: 'ID du responsable du dossier', required: false })
  @IsOptional()
  @IsString()
  responsableId?: string;

  @ApiProperty({
    description: 'Statut du dossier',
    enum: StatutDossier,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutDossier)
  statut?: StatutDossier;
}
