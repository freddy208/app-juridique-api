import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDate } from 'class-validator';
import { TachePriorite, StatutTache } from '@prisma/client';

export class UpdateTacheDto {
  @ApiProperty({ description: 'Titre de la tâche', required: false })
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiProperty({ description: 'Description de la tâche', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "ID de l'utilisateur assigné", required: false })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiProperty({
    description: 'Priorité de la tâche',
    enum: TachePriorite,
    required: false,
  })
  @IsOptional()
  @IsEnum(TachePriorite)
  priorite?: TachePriorite;

  @ApiProperty({
    description: 'Statut de la tâche',
    enum: StatutTache,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutTache)
  statut?: StatutTache;

  @ApiProperty({ description: 'Date limite de la tâche', required: false })
  @IsOptional()
  @IsDate()
  dateLimite?: Date;
}
