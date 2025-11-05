import { TypeClient, StatutClient } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsBoolean,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  prenom: string;

  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  entreprise?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  pays?: string;

  @IsOptional()
  @IsString()
  codePostal?: string;

  @IsOptional()
  @IsEnum(TypeClient)
  typeClient?: TypeClient = TypeClient.PARTICULIER;

  @IsOptional()
  @IsEnum(StatutClient)
  statut?: StatutClient = StatutClient.ACTIF;

  @IsOptional()
  @IsString()
  numeroClient?: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsBoolean()
  estVIP?: boolean = false;
}
