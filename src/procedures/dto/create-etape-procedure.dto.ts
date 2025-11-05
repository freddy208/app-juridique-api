import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsEnum,
} from 'class-validator';
import { StatutEtape } from '@prisma/client';

export class CreateEtapeProcedureDto {
  @ApiProperty({ description: 'ID de la procédure' })
  @IsNotEmpty()
  @IsUUID()
  procedureId: string;

  @ApiProperty({ description: "Nom de l'étape" })
  @IsNotEmpty()
  @IsString()
  nom: string;

  @ApiProperty({ description: "Description de l'étape", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Date de début' })
  @IsNotEmpty()
  @IsString()
  dateDebut: string;

  @ApiProperty({ description: 'Date de fin', required: false })
  @IsOptional()
  @IsString()
  dateFin?: string;

  @ApiProperty({ description: 'Délai légal en jours', required: false })
  @IsOptional()
  @IsInt()
  delaiLegal?: number;

  @ApiProperty({
    description: "Statut de l'étape",
    enum: StatutEtape,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutEtape)
  statut?: StatutEtape;

  @ApiProperty({ description: 'ID du responsable', required: false })
  @IsOptional()
  @IsUUID()
  responsableId?: string;
}
