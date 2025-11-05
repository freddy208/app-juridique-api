import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryCommentairesDto {
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
  @IsUUID()
  utilisateurId?: string;

  @ApiProperty({ description: 'ID du document', required: false })
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @ApiProperty({ description: 'ID de la tâche', required: false })
  @IsOptional()
  @IsUUID()
  tacheId?: string;

  @ApiProperty({ description: 'Statut du commentaire', required: false })
  @IsOptional()
  @IsString()
  statut?: string;

  @ApiProperty({ description: 'Terme de recherche', required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
