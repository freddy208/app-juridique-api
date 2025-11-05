import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { TypeCorrespondance } from '@prisma/client';

export class CreateCorrespondanceDto {
  @ApiProperty({
    description: 'Type de correspondance',
    enum: TypeCorrespondance,
  })
  @IsEnum(TypeCorrespondance)
  @IsNotEmpty()
  type: TypeCorrespondance;

  @ApiProperty({
    description: 'Contenu de la correspondance',
    example: 'Discussion téléphonique concernant le dossier XYZ',
  })
  @IsNotEmpty()
  @IsString()
  contenu: string;

  @ApiProperty({ description: 'ID du client', required: false })
  @IsOptional()
  @IsUUID()
  clientId?: string;
}
