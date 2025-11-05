// src/depenses/dto/query-depense.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer'; // Important pour transformer les query params en nombres
import { CategorieDepense, StatutDepense } from '@prisma/client';

export class QueryDepenseDto {
  // --- Attributs de Pagination ---

  @ApiProperty({
    required: false,
    description: 'Numéro de la page à récupérer',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number) // Transforme automatiquement la chaîne de caractères en nombre
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    required: false,
    description: "Nombre d'éléments par page",
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    required: false,
    description: 'Champ utilisé pour le tri',
    example: 'dateDepense',
    default: 'dateDepense',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'dateDepense';

  @ApiProperty({
    required: false,
    description: 'Ordre de tri (ascendant ou descendant)',
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  // --- Attributs de Filtre ---

  @ApiProperty({
    enum: CategorieDepense,
    required: false,
    description: 'Filtrer par catégorie de dépense',
  })
  @IsOptional()
  @IsEnum(CategorieDepense)
  categorie?: CategorieDepense;

  @ApiProperty({
    enum: StatutDepense,
    required: false,
    description: 'Filtrer par statut de la dépense',
  })
  @IsOptional()
  @IsEnum(StatutDepense)
  statut?: StatutDepense;

  @ApiProperty({
    required: false,
    description: "Filtrer par l'ID du dossier associé",
  })
  @IsOptional()
  @IsString()
  dossierId?: string;

  @ApiProperty({
    required: false,
    description:
      'Filtrer les dépenses à partir de cette date (format YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  dateMin?: string;

  @ApiProperty({
    required: false,
    description: "Filtrer les dépenses jusqu'à cette date (format YYYY-MM-DD)",
  })
  @IsOptional()
  @IsString()
  dateMax?: string;
}
