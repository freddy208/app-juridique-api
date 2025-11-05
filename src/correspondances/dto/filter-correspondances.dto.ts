import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TypeCorrespondance, StatutCorrespondance } from '@prisma/client';

export class QueryCorrespondanceDto {
  @ApiProperty({ description: 'Numéro de page', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: "Nombre d'éléments par page",
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Champ de tri',
    required: false,
    default: 'creeLe',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'creeLe';

  @ApiProperty({
    description: 'Ordre de tri',
    required: false,
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ description: "ID de l'utilisateur", required: false })
  @IsOptional()
  @IsString()
  utilisateurId?: string;

  @ApiProperty({ description: 'ID du client', required: false })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({
    description: 'Type de correspondance',
    enum: TypeCorrespondance,
    required: false,
  })
  @IsOptional()
  @IsEnum(TypeCorrespondance)
  type?: TypeCorrespondance;

  @ApiProperty({
    description: 'Statut de la correspondance',
    enum: StatutCorrespondance,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutCorrespondance)
  statut?: StatutCorrespondance;

  @ApiProperty({ description: 'Terme de recherche', required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
