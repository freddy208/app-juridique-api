import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutDocument } from '@prisma/client';

export class FilterDocumentDto {
  @IsOptional()
  @IsEnum(StatutDocument, { message: 'StatutDocument invalide' })
  statut?: StatutDocument;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  skip = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  take = 10;
}
