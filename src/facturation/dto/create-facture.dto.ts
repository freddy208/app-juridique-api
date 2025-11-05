import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsDateString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateLigneFactureDto {
  @IsString()
  description: string;

  @IsNumber()
  @Type(() => Number)
  quantite: number;

  @IsNumber()
  @Type(() => Number)
  prixUnitaire: number;
}

export class CreateFactureDto {
  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  dossierId?: string;

  @IsOptional()
  @IsDateString()
  dateEcheance?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLigneFactureDto)
  lignes: CreateLigneFactureDto[];
}
