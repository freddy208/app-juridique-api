import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleUtilisateur, StatutUtilisateur } from '@prisma/client';

export class QueryUsersDto {
  @ApiProperty({
    description: 'Rôle pour filtrer',
    enum: RoleUtilisateur,
    required: false,
  })
  @IsOptional()
  @IsEnum(RoleUtilisateur)
  role?: RoleUtilisateur;

  @ApiProperty({
    description: 'Statut pour filtrer',
    enum: StatutUtilisateur,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutUtilisateur)
  statut?: StatutUtilisateur;

  @ApiProperty({ description: 'Terme de recherche', required: false })
  @IsOptional()
  @IsString()
  search?: string;

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
}
