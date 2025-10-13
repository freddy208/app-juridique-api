import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatutFacture } from '@prisma/client';

export class UpdateStatusInvoiceDto {
  @ApiProperty({
    enum: StatutFacture,
    description: 'Nouveau statut de la facture',
  })
  @IsEnum(StatutFacture, { message: 'Statut invalide' })
  statut: StatutFacture;
}
