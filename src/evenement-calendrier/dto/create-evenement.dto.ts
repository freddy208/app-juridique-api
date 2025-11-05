import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEvenementDto {
  @ApiProperty({ description: "Titre de l'événement" })
  @IsNotEmpty()
  @IsString()
  titre: string;

  @ApiProperty({ description: "Description de l'événement", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID du dossier associé', required: false })
  @IsOptional()
  @IsUUID()
  dossierId?: string;

  @ApiProperty({ description: "Date et heure de début de l'événement" })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  debut: Date;

  @ApiProperty({ description: "Date et heure de fin de l'événement" })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  fin: Date;
}
