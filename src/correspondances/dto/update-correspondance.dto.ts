import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TypeCorrespondance, StatutCorrespondance } from '@prisma/client';

export class UpdateCorrespondanceDto {
  @ApiProperty({
    description: 'Type de correspondance',
    enum: TypeCorrespondance,
    required: false,
  })
  @IsOptional()
  @IsEnum(TypeCorrespondance)
  type?: TypeCorrespondance;

  @ApiProperty({ description: 'Contenu de la correspondance', required: false })
  @IsOptional()
  @IsString()
  contenu?: string;

  @ApiProperty({
    description: 'Statut de la correspondance',
    enum: StatutCorrespondance,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutCorrespondance)
  statut?: StatutCorrespondance;
}
