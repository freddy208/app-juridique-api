import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum } from 'class-validator';
import { TypeMouvement } from '@prisma/client';

export class AjouterMouvementDto {
  @ApiProperty({ description: 'Type de mouvement', enum: TypeMouvement })
  @IsEnum(TypeMouvement)
  type: TypeMouvement;

  @ApiProperty({ description: 'Montant du mouvement' })
  @IsNumber()
  montant: number;

  @ApiProperty({ description: 'Description du mouvement' })
  @IsString()
  description: string;
}
