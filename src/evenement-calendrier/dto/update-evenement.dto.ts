import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutEvenement } from '@prisma/client';

export class UpdateEvenementDto {
  @ApiProperty({ description: "Titre de l'événement", required: false })
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiProperty({ description: "Description de l'événement", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID du dossier associé', required: false })
  @IsOptional()
  @IsUUID()
  dossierId?: string;

  @ApiProperty({
    description: "Date et heure de début de l'événement",
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  debut?: Date;

  @ApiProperty({
    description: "Date et heure de fin de l'événement",
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fin?: Date;

  @ApiProperty({
    description: "Statut de l'événement",
    enum: StatutEvenement,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutEvenement)
  statut?: StatutEvenement;
}
