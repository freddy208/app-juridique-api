import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDecimal } from 'class-validator';
import { StatutProcedure } from '@prisma/client';

export class UpdateProcedureDto {
  @ApiProperty({ description: 'Type de procédure', required: false })
  @IsOptional()
  @IsString()
  typeProcedure?: string;

  @ApiProperty({ description: 'Juridiction', required: false })
  @IsOptional()
  @IsString()
  juridiction?: string;

  @ApiProperty({ description: 'Numéro Rôle Général', required: false })
  @IsOptional()
  @IsString()
  numeroRG?: string;

  @ApiProperty({ description: "Date d'introduction", required: false })
  @IsOptional()
  @IsString()
  dateIntroduction?: string;

  @ApiProperty({ description: 'Montant réclamé', required: false })
  @IsOptional()
  @IsDecimal()
  montantReclame?: string;

  @ApiProperty({ description: 'Étape actuelle', required: false })
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
