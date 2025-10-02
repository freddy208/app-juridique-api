import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatutDossier } from '@prisma/client';

export class UpdateDossierStatusDto {
  @ApiProperty({
    enum: StatutDossier,
    description: 'Nouveau statut du dossier',
    example: StatutDossier.EN_COURS,
  })
  @IsEnum(StatutDossier, {
    message: `Le statut doit être l'un de: ${Object.values(StatutDossier).join(', ')}`,
  })
  statut: StatutDossier;
}
