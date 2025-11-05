import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { StatutAudience } from '@prisma/client';

export class UpdateAudienceDto {
  @ApiProperty({ description: "Date de l'audience", required: false })
  @IsOptional()
  @IsString()
  dateAudience?: string;

  @ApiProperty({ description: "Heure de l'audience", required: false })
  @IsOptional()
  @IsString()
  heureAudience?: string;

  @ApiProperty({ description: "Salle d'audience", required: false })
  @IsOptional()
  @IsString()
  salle?: string;

  @ApiProperty({ description: "Objet de l'audience", required: false })
  @IsOptional()
  @IsString()
  objet?: string;

  @ApiProperty({ description: 'Avocat présent', required: false })
  @IsOptional()
  @IsString()
  avocat?: string;

  @ApiProperty({ description: "Résultat de l'audience", required: false })
  @IsOptional()
  @IsString()
  resultat?: string;

  @ApiProperty({ description: 'Prochaine date', required: false })
  @IsOptional()
  @IsString()
  prochaineDate?: string;

  @ApiProperty({
    description: "Statut de l'audience",
    enum: StatutAudience,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutAudience)
  statut?: StatutAudience;
}
