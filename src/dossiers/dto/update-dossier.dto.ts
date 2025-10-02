// src/dossiers/dto/update-dossier.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateDossierDto } from './create-dossier.dto';

export class UpdateDossierDto extends PartialType(CreateDossierDto) {}
