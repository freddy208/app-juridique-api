import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDate,
} from 'class-validator';
import { TachePriorite } from '@prisma/client';

export class CreateTacheDto {
  @ApiProperty({ description: 'Titre de la tâche' })
  @IsNotEmpty()
  @IsString()
  titre: string;

  @ApiProperty({ description: 'Description de la tâche', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID du dossier associé', required: false })
  @IsOptional()
  @IsUUID()
  dossierId?: string;

  @ApiProperty({ description: "ID de l'utilisateur assigné", required: false })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiProperty({ description: 'Priorité de la tâche', enum: TachePriorite })
  @IsOptional()
  @IsEnum(TachePriorite)
  priorite?: TachePriorite = TachePriorite.MOYENNE;

  @ApiProperty({ description: 'Date limite de la tâche', required: false })
  @IsOptional()
  @IsDate()
  dateLimite?: Date;
}
