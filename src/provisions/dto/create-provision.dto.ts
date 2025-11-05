import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateProvisionDto {
  @ApiProperty({ description: 'ID du dossier associé' })
  @IsUUID()
  dossierId: string;

  @ApiProperty({ description: 'ID du client associé' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ description: 'Montant de la provision' })
  @IsNumber()
  montant: number;

  @ApiProperty({ description: 'Date de la provision', required: false })
  @IsOptional()
  @IsDateString()
  dateProvision?: Date;
}
