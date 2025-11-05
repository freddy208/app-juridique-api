import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { TypePiece, StatutPiece } from '@prisma/client';

export class CreatePieceJustificativeDto {
  @ApiProperty({ description: 'ID de la procédure' })
  @IsNotEmpty()
  @IsUUID()
  procedureId: string;

  @ApiProperty({ description: 'Nom de la pièce' })
  @IsNotEmpty()
  @IsString()
  nom: string;

  @ApiProperty({ description: 'Type de pièce', enum: TypePiece })
  @IsNotEmpty()
  @IsEnum(TypePiece)
  type: TypePiece;

  @ApiProperty({ description: 'Date de dépôt' })
  @IsNotEmpty()
  @IsString()
  dateDepot: string;

  @ApiProperty({ description: 'Numéro de dépôt', required: false })
  @IsOptional()
  @IsString()
  numeroDepot?: string;

  @ApiProperty({ description: 'URL du document' })
  @IsNotEmpty()
  @IsString()
  documentUrl: string;

  @ApiProperty({
    description: 'Statut de la pièce',
    enum: StatutPiece,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutPiece)
  statut?: StatutPiece;
}
