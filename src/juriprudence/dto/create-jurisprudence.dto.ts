import {
  IsString,
  IsDate,
  IsEnum,
  IsArray,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  JuridictionCameroun,
  MatiereDroit,
  SensDecision,
} from '@prisma/client';

export class CreateJurisprudenceDto {
  @IsString()
  numeroArret: string;

  @IsEnum(JuridictionCameroun)
  juridiction: JuridictionCameroun;

  @IsDate()
  @Type(() => Date)
  dateDecision: Date;

  @IsString()
  parties: string;

  @IsEnum(MatiereDroit)
  matiere: MatiereDroit;

  @IsArray()
  @IsString({ each: true })
  motsCles: string[];

  @IsString()
  resume: string;

  @IsString()
  texteIntegral: string;

  @IsEnum(SensDecision)
  sensDecision: SensDecision;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsUrl()
  documentUrl?: string;
}
