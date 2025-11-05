import { PartialType } from '@nestjs/swagger';
import { CreatePaiementDto } from './create-paiement.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatutPaiement } from '@prisma/client';

export class UpdatePaiementDto extends PartialType(CreatePaiementDto) {
  @IsOptional()
  @IsEnum(StatutPaiement)
  statut?: StatutPaiement;

  @IsOptional()
  @IsString()
  motifRejet?: string; // Si le statut est REJETE
}
