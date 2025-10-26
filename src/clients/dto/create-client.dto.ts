// dto/create-client.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
} from 'class-validator';

export class CreateClientDto {
  @ApiProperty({
    description: 'Prénom du client',
    example: 'Jean',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est obligatoire' })
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
  @MaxLength(100, {
    message: 'Le prénom ne peut pas dépasser 100 caractères',
  })
  prenom: string;

  @ApiProperty({
    description: 'Nom du client',
    example: 'Dupont',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  nom: string;

  @ApiProperty({
    description: "Nom de l'entreprise (si client corporate)",
    example: 'SARL Dupont & Associés',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, {
    message: "Le nom de l'entreprise ne peut pas dépasser 200 caractères",
  })
  nomEntreprise?: string;

  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '+237677123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^(\+237)?[6][0-9]{8}$/, {
    message: 'Le numéro de téléphone doit être un numéro camerounais valide',
  })
  telephone?: string;

  @ApiProperty({
    description: 'Adresse email du client',
    example: 'jean.dupont@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: "L'adresse email n'est pas valide" })
  @MaxLength(150, { message: "L'email ne peut pas dépasser 150 caractères" })
  email?: string;

  @ApiProperty({
    description: 'Adresse complète du client',
    example: 'Bonanjo, Douala, Cameroun',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: "L'adresse ne peut pas dépasser 500 caractères",
  })
  adresse?: string;

  @ApiProperty({
    description: 'Statut VIP du client',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  statutVIP?: boolean;
}
