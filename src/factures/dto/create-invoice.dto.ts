import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'ID du client' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiPropertyOptional({ description: 'ID du dossier lié (optionnel)' })
  @IsString()
  @IsOptional()
  dossierId?: string;

  @ApiProperty({ description: 'Montant de la facture' })
  @IsNumber()
  @IsNotEmpty()
  montant: number;

  @ApiProperty({ description: "Date d'échéance de la facture (format ISO)" })
  @IsDateString()
  @IsNotEmpty()
  dateEcheance: string;

  @ApiPropertyOptional({
    description: 'Indique si la facture est payée ou non',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  payee?: boolean;

  @ApiPropertyOptional({
    description: 'Statut de la facture',
    enum: ['BROUILLON', 'ENVOYEE', 'PAYEE', 'EN_RETARD'],
    default: 'BROUILLON',
  })
  @IsOptional()
  statut?: 'BROUILLON' | 'ENVOYEE' | 'PAYEE' | 'EN_RETARD';
}
