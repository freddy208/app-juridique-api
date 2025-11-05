import { PartialType } from '@nestjs/swagger';
import { CreateHonoraireDto } from './create-honoraire.dto';
import { IsOptional, IsEnum, IsDecimal, IsDate } from 'class-validator';
import { StatutHonoraire } from '@prisma/client';

export class UpdateHonoraireDto extends PartialType(CreateHonoraireDto) {
  @IsOptional()
  @IsEnum(StatutHonoraire)
  statut?: StatutHonoraire;

  @IsOptional()
  @IsDecimal()
  override montantHT?: number;

  @IsOptional()
  @IsDecimal()
  override tauxTVA?: number;

  @IsOptional()
  @IsDate()
  override dateEcheance?: Date;
}
