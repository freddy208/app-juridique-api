// dashboard/dto/custom-report.dto.ts
import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { TypeDossier, StatutDossier } from '@prisma/client';

export class CustomReportDto {
  @IsOptional()
  @IsEnum(TypeDossier)
  type?: TypeDossier;

  @IsOptional()
  @IsEnum(StatutDossier)
  statut?: StatutDossier;

  @IsOptional()
  @IsUUID()
  responsableId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsDateString()
  creeLeStart?: string;

  @IsOptional()
  @IsDateString()
  creeLeEnd?: string;

  @IsOptional()
  @IsString()
  titreContains?: string;
}
