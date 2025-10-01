// src/clients/dto/create-client.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ description: 'Prénom du client' })
  @IsString()
  prenom: string;

  @ApiProperty({ description: 'Nom du client' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ description: "Nom de l'entreprise du client" })
  @IsOptional()
  @IsString()
  nomEntreprise?: string;

  @ApiPropertyOptional({ description: 'Email du client' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Téléphone du client' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({ description: 'Adresse du client' })
  @IsOptional()
  @IsString()
  adresse?: string;
}
