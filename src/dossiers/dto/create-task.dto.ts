// src/dossiers/dto/create-task.dto.ts
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TachePriorite } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  titre: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsEnum(TachePriorite)
  priorite?: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE';

  @IsOptional()
  @IsDateString()
  dateLimite?: Date;
}
