// src/dossiers/dto/create-facture.dto.ts
import { IsNumber, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateFactureDto {
  @IsNumber()
  montant: number;

  @IsDateString()
  dateEcheance: Date;

  @IsOptional()
  @IsString()
  clientId?: string;
}
