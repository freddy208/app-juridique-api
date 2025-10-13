// src/factures/dto/update-invoice.dto.ts
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ description: 'ID du client' })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'ID du dossier lié' })
  @IsString()
  @IsOptional()
  dossierId?: string;

  @ApiPropertyOptional({ description: 'Montant de la facture' })
  @IsNumber()
  @IsOptional()
  montant?: number;

  @ApiPropertyOptional({ description: "Date d'échéance (format ISO)" })
  @IsDateString()
  @IsOptional()
  dateEcheance?: string;

  @ApiPropertyOptional({
    description: 'Indique si la facture est payée ou non',
  })
  @IsBoolean()
  @IsOptional()
  payee?: boolean;

  @ApiPropertyOptional({
    description: 'Statut de la facture',
    enum: ['BROUILLON', 'ENVOYEE', 'PAYEE', 'EN_RETARD'],
  })
  @IsOptional()
  statut?: 'BROUILLON' | 'ENVOYEE' | 'PAYEE' | 'EN_RETARD';
}
