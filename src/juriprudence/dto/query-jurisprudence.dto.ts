import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  JuridictionCameroun,
  MatiereDroit,
  SensDecision,
} from '@prisma/client';

export class QueryJurisprudenceDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'dateDecision';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsEnum(JuridictionCameroun)
  juridiction?: JuridictionCameroun;

  @IsOptional()
  @IsEnum(MatiereDroit)
  matiere?: MatiereDroit;

  @IsOptional()
  @IsEnum(SensDecision)
  sensDecision?: SensDecision;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  motsCles?: string[];

  @IsOptional()
  @Type(() => Date)
  dateDecisionMin?: Date;

  @IsOptional()
  @Type(() => Date)
  dateDecisionMax?: Date;

  @IsOptional()
  @IsString()
  dossierId?: string;
}
