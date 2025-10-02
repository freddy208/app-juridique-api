import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutClient, TypeDossier, StatutDossier } from '@prisma/client'; // <-- ajouter StatutDossier

export class FilterClientDto {
  @ApiPropertyOptional({
    enum: StatutClient,
    description: 'Filtrer par statut',
  })
  @IsOptional()
  @IsEnum(StatutClient)
  statut?: StatutClient;

  @ApiPropertyOptional({ description: 'Recherche par prénom ou nom' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Recherche par entreprise' })
  @IsOptional()
  @IsString()
  nomEntreprise?: string;

  @ApiPropertyOptional({ description: 'Recherche par email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Recherche par téléphone' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({
    enum: TypeDossier,
    description: 'Filtrer par type de dossier lié',
  })
  @IsOptional()
  @IsEnum(TypeDossier)
  typeDossier?: TypeDossier;

  // ✅ Nouveau champ pour filtrer les dossiers par statut
  @ApiPropertyOptional({
    enum: StatutDossier,
    description: 'Filtrer par statut des dossiers liés',
  })
  @IsOptional()
  @IsEnum(StatutDossier)
  statutDossier?: StatutDossier;

  @ApiPropertyOptional({ description: 'Pagination - skip' })
  @Type(() => Number)
  @IsNumber()
  skip = 0;

  @ApiPropertyOptional({ description: 'Pagination - take' })
  @Type(() => Number)
  @IsNumber()
  take = 10;
}
