import { PartialType } from '@nestjs/swagger';
import { CreateJurisprudenceDto } from './create-jurisprudence.dto';

export class UpdateJurisprudenceDto extends PartialType(
  CreateJurisprudenceDto,
) {}
