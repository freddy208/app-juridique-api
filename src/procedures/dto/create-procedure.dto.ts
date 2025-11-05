import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDecimal,
} from 'class-validator';
import { TypeProcedure, StatutProcedure } from '@prisma/client';

export class CreateProcedureDto {
  @ApiProperty({ description: 'ID du dossier associé' })
  @IsNotEmpty()
  @IsUUID()
  dossierId: string;

  @ApiProperty({ description: 'Type de procédure', enum: TypeProcedure })
  @IsNotEmpty()
  @IsEnum(TypeProcedure)
  typeProcedure: TypeProcedure;

  @ApiProperty({ description: 'Juridiction' })
  @IsNotEmpty()
  @IsString()
  juridiction: string;

  @ApiProperty({ description: 'Numéro Rôle Général', required: false })
  @IsOptional()
  @IsString()
  numeroRG?: string;

  @ApiProperty({ description: "Date d'introduction" })
  @IsNotEmpty()
  @IsString()
  dateIntroduction: string;

  @ApiProperty({ description: 'Montant réclamé', required: false })
  @IsOptional()
  @IsDecimal()
  montantReclame?: string;

  @ApiProperty({ description: 'Étape actuelle' })
  @IsOptional()
  @IsString()
  etapeActuelle?: string;

  @ApiProperty({
    description: 'Statut de la procédure',
    enum: StatutProcedure,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutProcedure)
  statut?: StatutProcedure;
}
