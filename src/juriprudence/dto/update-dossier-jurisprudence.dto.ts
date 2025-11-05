import { PartialType } from '@nestjs/swagger';
import { CreateDossierJurisprudenceDto } from './create-dossier-jurisprudence.dto';

export class UpdateDossierJurisprudenceDto extends PartialType(
  CreateDossierJurisprudenceDto,
) {}
