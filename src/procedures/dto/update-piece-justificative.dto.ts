import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { StatutPiece } from '@prisma/client';

export class UpdatePieceJustificativeDto {
  @ApiProperty({ description: 'Nom de la pièce', required: false })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty({ description: 'Type de pièce', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Date de dépôt', required: false })
  @IsOptional()
  @IsString()
  dateDepot?: string;

  @ApiProperty({ description: 'Numéro de dépôt', required: false })
  @IsOptional()
  @IsString()
  numeroDepot?: string;

  @ApiProperty({ description: 'URL du document', required: false })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiProperty({
    description: 'Statut de la pièce',
    enum: StatutPiece,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutPiece)
  statut?: StatutPiece;
}
