// dto/add-identity-document.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';

export enum TypeDocumentIdentite {
  CNI = 'CNI',
  PASSEPORT = 'PASSEPORT',
  PERMIS_CONDUIRE = 'PERMIS_CONDUIRE',
  ACTE_NAISSANCE = 'ACTE_NAISSANCE',
  REGISTRE_COMMERCE = 'REGISTRE_COMMERCE',
  STATUTS_ENTREPRISE = 'STATUTS_ENTREPRISE',
  AUTRE = 'AUTRE',
}

export class AddIdentityDocumentDto {
  @ApiProperty({
    description: "Type de document d'identité",
    enum: TypeDocumentIdentite,
    example: TypeDocumentIdentite.CNI,
  })
  @IsEnum(TypeDocumentIdentite, {
    message: 'Type de document invalide',
  })
  @IsNotEmpty()
  type: TypeDocumentIdentite;

  @ApiProperty({
    description: 'Titre du document',
    example: 'CNI M.Talla',
  })
  @IsString()
  titre: string;

  @ApiProperty({
    description: 'Numéro du document',
    example: '123456789',
  })
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiProperty({
    description: 'Date de délivrance du document',
    example: '2020-01-15',
  })
  @IsOptional()
  @IsString()
  dateDelivrance?: string;

  @ApiProperty({
    description: "Date d'expiration du document",
    example: '2030-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateExpiration?: string;

  @ApiProperty({
    description: 'Lieu de délivrance',
    example: 'Douala',
    required: false,
  })
  @IsOptional()
  @IsString()
  lieuDelivrance?: string;
}
