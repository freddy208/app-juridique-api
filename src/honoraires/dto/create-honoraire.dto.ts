import {
  IsString,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsDate,
} from 'class-validator';
import { TypeHonoraire, ModeCalculHonoraire } from '@prisma/client';

export class CreateHonoraireDto {
  @IsString()
  dossierId: string;

  @IsString()
  clientId: string;

  @IsDecimal()
  montantHT: number;

  @IsOptional()
  @IsDecimal()
  tauxTVA?: number = 19.25;

  @IsEnum(TypeHonoraire)
  typeHonoraire: TypeHonoraire;

  @IsEnum(ModeCalculHonoraire)
  modeCalcul: ModeCalculHonoraire;

  @IsOptional()
  @IsString()
  baremeOHADA?: string;

  @IsOptional()
  @IsDate()
  dateEcheance?: Date;
}
