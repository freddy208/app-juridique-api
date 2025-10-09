// src/taches/dto/update-tache.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateTacheDto } from './create-tache.dto';

export class UpdateTacheDto extends PartialType(CreateTacheDto) {}
