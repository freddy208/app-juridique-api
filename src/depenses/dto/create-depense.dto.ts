// src/depenses/dto/create-depense.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { CategorieDepense } from '@prisma/client';

export class CreateDepenseDto {
  @ApiProperty({ description: 'ID du dossier concerné (optionnel)' })
  @IsOptional()
  @IsString()
  dossierId?: string;

  @ApiProperty({
    enum: CategorieDepense,
    description: 'Catégorie de la dépense',
  })
  @IsEnum(CategorieDepense)
  categorie: CategorieDepense;

  @ApiProperty({ description: 'Montant de la dépense' })
  @IsNumber()
  montant: number;

  @ApiProperty({ description: 'Description de la dépense' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Date de la dépense' })
  @IsDateString()
  dateDepense: string;

  @ApiProperty({ description: 'Bénéficiaire de la dépense (optionnel)' })
  @IsOptional()
  @IsString()
  beneficiaire?: string;

  @ApiProperty({
    description: 'Référence de la pièce justificative (optionnel)',
  })
  @IsOptional()
  @IsString()
  referencePiece?: string;
}
